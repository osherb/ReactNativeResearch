Java.perform(function () {
    const AAsset_getBuffer = Module.findExportByName("libandroid.so", "AAsset_getBuffer");
    const AAsset_getLength = Module.findExportByName("libandroid.so", "AAsset_getLength");

    if (AAsset_getBuffer && AAsset_getLength) {
        Interceptor.attach(AAsset_getBuffer, {
            onEnter: function (args) {
                console.log("[📜] Hooked AAsset_getBuffer");
                this.assetPtr = args[0];
            },
            onLeave: function (retval) {
                if (!retval.isNull()) {
                    console.log("[✅] AAsset_getBuffer returned:", retval);

                    try {
                        // Get JavaScript bundle length
                        const length = new NativeFunction(AAsset_getLength, "size_t", ["pointer"])(this.assetPtr);
                        if (length <= 0) {
                            console.log("[⚠] Invalid asset length");
                            return;
                        }

                        // Read the JavaScript bundle
                        let originalContent = Memory.readUtf8String(retval, length);
                        console.log("[📜] Last 100 bytes of bundle:\n", originalContent.slice(-100));

                        // Locate the console.log statement
                        const searchString = "console.log('Eval Hook Test!!!');";
                        if (!originalContent.includes(searchString)) {
                            console.log("[❌] Target log statement not found.");
                            return;
                        }

                        // Avoid multiple injections
                        if (originalContent.includes("Eval Hook Frida!!!")) {
                            console.log("[⚠] Injection already exists. Skipping.");
                            return;
                        }

                        // Code to append
                        const injectedCode = " alert('Eval Hook Frida!!!');";

                        // Inject **after** the search string
                        const modifiedContent = originalContent.replace(
                            searchString,
                            searchString + injectedCode
                        );

                        console.log("[📜] Modified Bundle (Last 100 bytes):\n", modifiedContent);

                        // Allocate memory for modified bundle
                        const newBufferSize = modifiedContent.length;
                        const newBuffer = Memory.allocUtf8String(modifiedContent);

                        // Write modified content back to memory
                        Memory.protect(retval, newBufferSize, 'rw-');

                        const chunkSize = 1024;
                        for (let i = 0; i < newBufferSize; i += chunkSize) {
                            const currentChunkSize = Math.min(chunkSize, newBufferSize - i);
                            const chunk = Memory.readByteArray(newBuffer.add(i), currentChunkSize);
                            Memory.writeByteArray(retval.add(i), chunk);
                        }

                        console.log("[✅] JavaScript modification successful!");
                    } catch (e) {
                        console.log("[❌] Error injecting JavaScript:", e.message);
                    }
                }
            }
        });
    } else {
        console.log("[⚠] AAsset_getBuffer or AAsset_getLength function not found");
    }
});
