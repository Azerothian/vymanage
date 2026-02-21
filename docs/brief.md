vyos web management via REST APi


## Tech
- nextjs - static render
- typescript
- vyos
- tanstack/query
- tailwindcss
- shadcn


## General Layout
|----------------------|
| menu     | header    |
|          |-----------|
|          |           |
|          | workspace |
|----------|           |
| profile  |           |          
|----------------------|


## Notes
- on start it promps for the http api access key
- connect and verify then stores the key in a cookie with a 1 day timeout
- loads the config on startup
- admin console style with all menu options on the left hand side
- left hand side menu can be minimised
- save needs a commit/commit-confirm that should show the diff from current to new
- it should pull down the latest to compare on prompt to save
- where appropriate tables should be drag and drop to rearrange the order of elements using react-dnd
- stylized scroll bars
- the ui should have the following screen management nodes
    - desktop
        - on click of new menu item it should open a new window
        - window header has the icon, name and right aligned min, max, and close buttons
        - window should be resizable 
        - onclick of window it should bring to the front
        - taskbar added below the the workspace.
        - override ctl+zoom or touch events for workspace zoom
        - workspace always show scroll bars, windows can be dragged to expand the workspace
    - split / dock mode
        - every section that splits the available screen space
        - window header should be draggable ontop of another window and it should split that current space 
        based off the nearest border to the drag point
        - if window is moved/split it should recalculate all windows
        - window borders should be draggable
        - window header should just have the menu name and a close button
    - inline
        - it should only show the selected menu item, no drag or window components like a normal page
        - scrolling should only affect the workspace
- ui type selection, window states should be stored in local storage and restored on load

- review ../vyos-documentation/docs/configuration for configuration options and menu groupings
- review ../vyos-documentation/docs/ for equivilant commands to display relevant data like metrics, with polling options to display alongside with the config items/


## Deployment
- Docker container
- need instructions on how to install