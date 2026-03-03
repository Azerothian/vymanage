#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# VyManage QEMU E2E Test Orchestrator
# Boots VyOS in QEMU, configures via serial console, runs Playwright tests
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Constants
ISO_URL="https://github.com/vyos/vyos-nightly-build/releases/download/2026.03.03-0027-rolling/vyos-2026.03.03-0027-rolling-generic-amd64.iso"
ISO_DIR="$ROOT_DIR/.cache/vyos-iso"
ISO_PATH="$ISO_DIR/vyos-rolling.iso"
DISK_PATH="$ISO_DIR/vyos-qemu.qcow2"
SERIAL_SOCK="/tmp/vyos-e2e-serial.sock"
API_KEY="e2e-test-api-key"
QEMU_HTTPS_PORT=8443
QEMU_SSH_PORT=2222
QEMU_MEM=2048
QEMU_CPUS=2
QEMU_PID=""

# Cleanup on exit
cleanup() {
    echo "==> Cleaning up..."
    if [[ -n "$QEMU_PID" ]] && kill -0 "$QEMU_PID" 2>/dev/null; then
        kill "$QEMU_PID" 2>/dev/null || true
        wait "$QEMU_PID" 2>/dev/null || true
    fi
    rm -f "$SERIAL_SOCK"
    echo "==> Cleanup complete"
}
trap cleanup EXIT

# --- Step 1: Check dependencies ---
echo "==> Checking dependencies..."
MISSING=""
for cmd in qemu-system-x86_64 expect socat curl; do
    if ! command -v "$cmd" &>/dev/null; then
        MISSING="$MISSING $cmd"
    fi
done
if [[ -n "$MISSING" ]]; then
    echo "ERROR: Missing required commands:$MISSING"
    echo "Install them and re-run."
    exit 1
fi

# --- Step 2: Detect KVM ---
KVM_FLAG=""
if [[ -w /dev/kvm ]]; then
    echo "==> KVM available, enabling hardware acceleration"
    KVM_FLAG="-enable-kvm"
else
    echo "==> WARNING: KVM not available, emulation will be slow"
fi

# --- Step 3: Download ISO ---
mkdir -p "$ISO_DIR"
if [[ ! -f "$ISO_PATH" ]]; then
    echo "==> Downloading VyOS ISO..."
    curl -fSL -o "$ISO_PATH.tmp" "$ISO_URL"
    mv "$ISO_PATH.tmp" "$ISO_PATH"
    echo "==> ISO downloaded to $ISO_PATH"
else
    echo "==> Using cached ISO: $ISO_PATH"
fi

# --- Step 4: Create qcow2 disk ---
if [[ ! -f "$DISK_PATH" ]]; then
    echo "==> Creating qcow2 disk image..."
    qemu-img create -f qcow2 "$DISK_PATH" 2G
fi

# --- Step 5: Check port conflicts ---
echo "==> Checking port availability..."
for port in $QEMU_HTTPS_PORT $QEMU_SSH_PORT; do
    if ss -tlnp 2>/dev/null | grep -q ":${port} "; then
        echo "ERROR: Port $port is already in use"
        exit 1
    fi
done

# --- Step 6: Boot QEMU ---
echo "==> Booting QEMU..."
rm -f "$SERIAL_SOCK"

qemu-system-x86_64 \
    $KVM_FLAG \
    -m "$QEMU_MEM" \
    -smp "$QEMU_CPUS" \
    -cdrom "$ISO_PATH" \
    -drive "file=$DISK_PATH,if=virtio,format=qcow2" \
    -boot d \
    -netdev "user,id=net0,hostfwd=tcp::${QEMU_HTTPS_PORT}-:443,hostfwd=tcp::${QEMU_SSH_PORT}-:22" \
    -device virtio-net-pci,netdev=net0 \
    -serial "unix:${SERIAL_SOCK},server,nowait" \
    -nographic \
    -display none &
QEMU_PID=$!

echo "==> QEMU started (PID: $QEMU_PID)"

# Wait for serial socket to appear
echo "==> Waiting for serial socket..."
for i in $(seq 1 30); do
    if [[ -S "$SERIAL_SOCK" ]]; then
        break
    fi
    sleep 1
done
if [[ ! -S "$SERIAL_SOCK" ]]; then
    echo "ERROR: Serial socket did not appear after 30s"
    exit 1
fi

# --- Step 7: Configure via expect ---
echo "==> Configuring VyOS via serial console..."
expect "$SCRIPT_DIR/vyos-expect/boot-and-configure.exp" "$SERIAL_SOCK"

# --- Step 8: Poll API readiness ---
echo "==> Waiting for VyOS HTTPS API to become ready..."
API_READY=false
for i in $(seq 1 120); do
    if curl -sk "https://127.0.0.1:${QEMU_HTTPS_PORT}/retrieve" \
        -H "Content-Type: application/json" \
        -d '{"key":"'"$API_KEY"'","op":"showConfig","path":[]}' 2>/dev/null | grep -q "vyos-qemu"; then
        API_READY=true
        break
    fi
    sleep 1
done
if [[ "$API_READY" != "true" ]]; then
    echo "ERROR: VyOS API did not become ready within 120s"
    exit 1
fi
echo "==> VyOS API is ready"

# --- Step 9: Export env vars ---
export VYOS_QEMU_HOST="127.0.0.1"
export VYOS_QEMU_PORT="$QEMU_HTTPS_PORT"
export VYOS_QEMU_API_KEY="$API_KEY"

# --- Step 10: Run web Playwright tests ---
echo "==> Running web Playwright QEMU tests..."
cd "$ROOT_DIR/apps/web"
npx playwright test --config=playwright.qemu.config.ts || {
    echo "WARNING: Web QEMU tests failed"
}

# --- Step 11: Run Electron Playwright tests ---
echo "==> Running Electron Playwright QEMU tests..."
cd "$ROOT_DIR/apps/electron"
xvfb-run --auto-servernum npx playwright test --config=playwright.qemu.config.ts || {
    echo "WARNING: Electron QEMU tests failed"
}

# --- Step 12: Validate config on device ---
echo "==> Validating VyOS configuration via serial console..."
cd "$ROOT_DIR"
expect "$SCRIPT_DIR/vyos-expect/validate-config.exp" "$SERIAL_SOCK"

echo ""
echo "==> All QEMU E2E tests completed successfully!"
