/**
 * Screenshot Panel for After Effects 2025
 * - Button: 150x50, centered
 * - Single high-quality JPEG using saveFrameToPng then convert
 * - Silent save, no render queue issues
 */
(function screenshotPanel(thisObj) {
    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Screenshot Panel", undefined, { resizeable: true });
        
        // Layout - make button responsive to panel size with minimal padding
        var res =
        "group { \
            orientation: 'column', alignment: ['fill','fill'], alignChildren: ['fill','fill'], margins: 6, spacing: 0, \
            btn: Button { text:'Screenshot', alignment: ['fill','fill'] } \
        }";
        
        win.grp = win.add(res);
        
        try { win.minimumSize = [80, 50]; } catch (e) {}
        
        win.onResizing = win.onResize = function () { 
            this.layout.resize(); 
        };
        
        // Button click
        win.grp.btn.onClick = function () {
            try {
                // Check if project exists
                if (!app.project) {
                    return;
                }
                
                var comp = app.project.activeItem;
                if (!(comp instanceof CompItem)) {
                    return;
                }
                
                var desktopPath = Folder.desktop.fsName;
                
                // Calculate actual frame number from current time and pad with zeros
                var currentFrame = Math.round(comp.time * comp.frameRate);
                var paddedFrame = ('00000' + currentFrame).slice(-5); // 5-digit padding like AE timeline
                var safeCompName = comp.name.replace(/[:*?"<>|\\\/]/g, '-');
                var filename = safeCompName + '_frame_' + paddedFrame + '.png';
                var outFile = new File(desktopPath + '/' + filename);
                
                // Use After Effects' built-in saveFrameToPng method
                // This bypasses the render queue entirely
                try {
                    comp.saveFrameToPng(comp.time, outFile);
                    $.writeln('Screenshot saved: ' + outFile.fsName);
                    
                    // Wait for file to be created before opening location
                    var maxWait = 50; // Maximum wait iterations (5 seconds)
                    var waitCount = 0;
                    
                    while (!outFile.exists && waitCount < maxWait) {
                        $.sleep(100); // Wait 100ms
                        waitCount++;
                    }
                    
                    // Only open if file actually exists
                    if (outFile.exists) {
                        // Open file location and select the file
                        if ($.os.indexOf("Windows") !== -1) {
                            // Windows: Use explorer with /select flag
                            system.callSystem('explorer /select,"' + outFile.fsName + '"');
                        } else {
                            // Mac: Use Finder with reveal
                            system.callSystem('open -R "' + outFile.fsName + '"');
                        }
                    }
                    
                } catch (saveError) {
                    // If saveFrameToPng fails, try the manual render approach with minimal settings
                    try {
                        var rqItem = app.project.renderQueue.items.add(comp);
                        
                        // Set time span to exactly one frame
                        rqItem.timeSpanStart = comp.time;
                        rqItem.timeSpanDuration = comp.frameDuration;
                        
                        var om = rqItem.outputModule(1);
                        
                        // Use the simplest possible settings
                        om.file = outFile;
                        
                        // Try to set PNG format with minimal configuration
                        try {
                            om.format = "PNG";
                        } catch (formatError) {
                            // If PNG fails, try any available still format
                            om.format = "Photoshop";
                            outFile = new File(desktopPath + '/' + safeCompName + '_' + timecode + '.psd');
                            om.file = outFile;
                        }
                        
                        // Render with minimal settings
                        app.project.renderQueue.render();
                        
                        // Clean up
                        rqItem.remove();
                        
                        $.writeln('Screenshot saved: ' + outFile.fsName);
                        
                        // Wait for file to be created before opening location
                        var maxWait = 50; // Maximum wait iterations (5 seconds)
                        var waitCount = 0;
                        
                        while (!outFile.exists && waitCount < maxWait) {
                            $.sleep(100); // Wait 100ms
                            waitCount++;
                        }
                        
                        // Only open if file actually exists
                        if (outFile.exists) {
                            // Open file location and select the file
                            if ($.os.indexOf("Windows") !== -1) {
                                // Windows: Use explorer with /select flag
                                system.callSystem('explorer /select,"' + outFile.fsName + '"');
                            } else {
                                // Mac: Use Finder with reveal
                                system.callSystem('open -R "' + outFile.fsName + '"');
                            }
                        }
                        
                    } catch (renderError) {
                        // Silent fail - both methods failed
                    }
                }
                
            } catch (error) {
                // Silent error handling
            }
        };
        
        win.layout.layout(true);
        
        if (win instanceof Window) {
            win.center();
            win.show();
        }
        
        return win;
    }
    
    buildUI(thisObj);
})(this);