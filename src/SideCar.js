import { Command } from "@tauri-apps/plugin-shell";

async function SideCar(arg1, arg2, arg3) {
    console.log("SideCar called with args:", arg1, arg2, arg3);
    const command = Command.sidecar('binaries/my-sidecar/kalam-Sidecar' , [
        arg1,
        arg2,
        arg3
    ]);
    const output = await command.execute();
    return output.stdout;
}

export default SideCar;