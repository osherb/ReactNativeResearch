Java.perform(function () {
    var MessageQueueThreadImpl = Java.use("com.facebook.react.bridge.queue.MessageQueueThreadImpl");
    var Exception = Java.use("java.lang.Exception");
    var Log = Java.use("android.util.Log");

    function safelyCall(func, context, args) {
        try {
            if (context && func) {
                return func.apply(context, args);
            }
        } catch (e) {
            console.log("[❌] Error in safelyCall: " + e.message);
            return null;
        }
    }

    MessageQueueThreadImpl.runOnQueue.implementation = function (runnable) {
        try {
            console.log("[🔥] runOnQueue called!");

            // Try to get the class name of the Runnable
            if (runnable) {
                console.log("[📝] Runnable Class: " + runnable.$className);

                // Skip SurfaceRegistryBinding interactions
                if (runnable.$className === "com.facebook.jni.NativeRunnable" &&
                    runnable.toString().includes("SurfaceRegistryBinding")) {
                    console.log("[⏭️] Skipping SurfaceRegistryBinding interaction.");
                    return;
                }

                // Hook into additional methods related to JS bundle loading
                if (runnable.$className === "com.facebook.jni.NativeRunnable") {
                    console.log("[🔍] Hooking into NativeRunnable...");

                    // Hook ReactInstance.loadJSBundleFromAssets
                    safelyCall(hookLoadJSBundleFromAssets, this, []);

                    // Hook JSBundleLoader.loadScript
//                    safelyCall(hookLoadScript, this, []);
                    Interceptor.attach(Module.findExportByName("libreactnative.so", "_ZN8facebook5react20loadScriptFromAssetsEP13AAssetManagerRKNSt6__ndk112basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEE"), {
                        onEnter: function (args) {
                            console.log("[+] Hooked loadScriptFromAssets");

                            // Capture arguments
                            const manager = args[0];
                            const assetNamePtr = args[1];

                            if (assetNamePtr.isNull()) {
                                console.log("[⚠] Invalid assetName pointer");
                                return;
                            }

                            try {
                                // Read the asset name from the pointer
                                const assetName = Memory.readUtf8String(assetNamePtr);
                                console.log("[📜] Arguments:");
                                console.log("    manager:", manager);
                                console.log("    assetName:", assetName);

                                // Open the asset using the asset manager
                                const AAssetManager_open = new NativeFunction(
                                    Module.findExportByName("libandroid.so", "AAssetManager_open"),
                                    "pointer",
                                    ["pointer", "pointer", "int"]
                                );
                                const AASSET_MODE_STREAMING = 2;
                                const asset = AAssetManager_open(manager, Memory.allocUtf8String(assetName), AASSET_MODE_STREAMING);
                                if (asset.isNull()) {
                                    console.log("[⚠] Failed to open asset");
                                    return;
                                }

                                // Read the content of the asset
                                const AAsset_getLength = new NativeFunction(
                                    Module.findExportByName("libandroid.so", "AAsset_getLength"),
                                    "size_t",
                                    ["pointer"]
                                );
                                const AAsset_read = new NativeFunction(
                                    Module.findExportByName("libandroid.so", "AAsset_read"),
                                    "int",
                                    ["pointer", "pointer", "size_t"]
                                );

//                                const length = AAsset_getLength(asset);
//                                const buffer = Memory.alloc(length);
//                                AAsset_read(asset, buffer, length);
//                                const scriptContent = Memory.readUtf8String(buffer, length);
//                                console.log("[📜] Script Content:\n" + scriptContent);
//
//                                // Create JSBigBufferString and log its details
//                                const scriptSize = scriptContent.length;
//                                const bufPtr = Memory.alloc(scriptSize);
//                                Memory.writeUtf8String(bufPtr, scriptContent);

                                console.log("[+] Creating JSBigBufferString");
                                console.log("[📜] JSBigBufferString Details:");
                                console.log("    buffer pointer:", bufPtr);
                                console.log("    script size:", scriptSize);
                                console.log("    buffer content:", Memory.readUtf8String(bufPtr, scriptSize));
                            } catch (e) {
                                console.log("[❌] Error reading asset or creating buffer: " + e.message);
                            }
                        },
                        onLeave: function (retval) {
                            console.log("[+] loadScriptFromAssets execution completed");

                            // Capture return value
                            if (retval.isNull()) {
                                console.log("[⚠] Invalid script content pointer");
                                return;
                            }

                            try {
                                const scriptContentPtr = retval;
                                const scriptContent = Memory.readUtf8String(scriptContentPtr);

                                console.log("[📜] Script Content (onLeave):\n" + scriptContent);

                                // Optionally, modify the script content (example: override console.log)
                                const modifiedScript = scriptContent.replace(/console\.log/g, function(match) {
                                    return match + " = function() { print('I took your console log'); }";
                                });

                                // Write the modified script back to memory
                                Memory.writeUtf8String(scriptContentPtr, modifiedScript);
                            } catch (e) {
                                console.log("[❌] Error reading or modifying script content: " + e.message);
                            }
                        }
                    });


                    console.log("[*] Script to hook loadScriptFromAssets function completed");

                }
            } else {
                console.log("[⚠] Runnable is null");
            }

            // Print Java stack trace
//            console.log(Log.getStackTraceString(Exception.$new()));

        } catch (e) {
            console.log("[❌] Error in runOnQueue: " + e.message);
        }

        // Call the original method
        return safelyCall(this.runOnQueue, this, [runnable]);
    };

    function hookLoadJSBundleFromAssets() {
        try {
            var ReactInstance = Java.use("com.facebook.react.runtime.ReactInstance");
            var loadJSBundleFromAssets = ReactInstance.loadJSBundleFromAssets.overload('android.content.res.AssetManager', 'java.lang.String');
            loadJSBundleFromAssets.implementation = function(assetManager, bundleName) {
                console.log("[📦] loadJSBundleFromAssets called with arguments:");
                console.log("    assetManager:", assetManager);
                console.log("    bundleName:", bundleName);

                if (assetManager && bundleName) {
                    try {
                        // Read the JS bundle content
                        var inputStream = assetManager.open(bundleName.replace("assets://", ""));
                        var reader = Java.use("java.io.BufferedReader").$new(Java.use("java.io.InputStreamReader").$new(inputStream));
                        var content = '';
                        var line;
                        while ((line = reader.readLine()) !== null) {
                            content += line + '\n';
                        }
                        reader.close();
                        inputStream.close();
                    } catch (e) {
                        console.log("[❌] Error reading JS bundle content: " + e.message);
                    }
                } else {
                    console.log("[⚠] Invalid arguments for loadJSBundleFromAssets.");
                }

                var result = safelyCall(this.loadJSBundleFromAssets, this, [assetManager, bundleName]);
                console.log("[📦] loadJSBundleFromAssets completed.");
                return result;
            };
        } catch (e) {
            console.log("[❌] Error in hookLoadJSBundleFromAssets: " + e.message);
        }
    }

    function hookLoadScript() {
        try {
            var JSBundleLoader = Java.use("com.facebook.react.bridge.JSBundleLoader$1");
            var loadScript = JSBundleLoader.loadScript.overload('com.facebook.react.bridge.JSBundleLoaderDelegate');
            console.log("loadScript ",JSON.stringify(loadScript))
            loadScript.implementation = function(delegate) {
                console.log("[📜] loadScript called with arguments:");
                console.log("    delegate:", delegate);

                if (delegate) {
                    var result = safelyCall(this.loadScript, this, [delegate]);
                    console.log("[📜] loadScript completed.");
                    return result;
                } else {
                    console.log("[⚠] Invalid delegate for loadScript.");
                }
            };
        } catch (e) {
            console.log("[❌] Error in hookLoadScript: " + e.message);
        }
    }

    // Native function hooks using Interceptor


    console.log("[*] Script to hook loadScriptFromAssets function completed");
});
