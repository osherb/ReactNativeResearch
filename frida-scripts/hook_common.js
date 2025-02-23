Java.perform(function () {
    const libName = "libreactnative.so";
    const exports = Module.enumerateExportsSync(libName);

    console.log(`[📜] Enumerating exports in ${libName}`);
    exports.forEach(function (exp) {
        if(exp.name.includes("getBufferedRuntimeExecutor") && exp.type === "function"){
            console.log(`    ${exp.type} ${exp.name} at ${exp.address}`);
        }

    });
});


Java.perform(function () {
    const functions = [
        { address: "0x77903b3000", name: "_ZN8facebook3jni6detail13MethodWrapperIMNS_5react14JReactInstanceEDoFNS0_9alias_refIPNS1_8JTypeForINS0_11HybridClassINS3_16JRuntimeExecutorENS1_15BaseHybridClassEE8JavaPartENS0_7JObjectEvE11_javaobjectEEEvEXadL_ZNS4_26getBufferedRuntimeExecutorEvEES4_SG_JEE8dispatchENS5_IPNS6_INS7_IS4_S9_E8JavaPartESC_vE11_javaobjectEEE" },
        { address: "0x77903b0574", name: "_ZN8facebook3jni6detail13MethodWrapperIMNS_5react14JReactInstanceEDoFNS0_9alias_refIPNS1_8JTypeForINS0_11HybridClassINS3_16JRuntimeExecutorENS1_15BaseHybridClassEE8JavaPartENS0_7JObjectEvE11_javaobjectEEEvEXadL_ZNS4_26getBufferedRuntimeExecutorEvEES4_SG_JEE4callEP7_JNIEnvP8_jobject" },
        { address: "0x77903b0334", name: "_ZN8facebook5react14JReactInstance26getBufferedRuntimeExecutorEv" },
        { address: "0x77901b7ea4", name: "_ZN8facebook5react13ReactInstance26getBufferedRuntimeExecutorEv" }
    ];

    functions.forEach(function (func) {
        try {
            const funcPtr = ptr(func.address);
            Interceptor.attach(Module.findExportByName("libreactnative.so", "_ZN8facebook5react20loadScriptFromAssetsEP13AAssetManagerRKNSt6__ndk112basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEE"), {
                onEnter: function (args) {
                    console.log("[📜] Entering " + func.name);
                    for (let i = 0; i < args.length; i++) {
                        console.log("    arg[" + i + "]: " + args[i]);
                    }
                },
                onLeave: function (retval) {
                    console.log("[📜] Leaving " + func.name);
                    console.log("    retval: " + retval);
                }
            });

            console.log("[*] Hooked " + func.name + " successfully");
        } catch (error) {
            console.error("[⚠] Failed to hook " + func.name + ": " + error.message);
        }
    });
});
