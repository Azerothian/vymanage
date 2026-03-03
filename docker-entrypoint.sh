#!/bin/sh
# Inject VYMANAGE_DEFAULT_HOST into the static export if set
if [ -n "$VYMANAGE_DEFAULT_HOST" ]; then
  # Create a runtime config file that the app reads
  cat > /usr/share/nginx/html/config.json << EOF
{
  "defaultHost": "$VYMANAGE_DEFAULT_HOST"
}
EOF
  echo "VyManage: Default host set to $VYMANAGE_DEFAULT_HOST"
fi
