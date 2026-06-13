import {mkdir, exists, writeTextFile, readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";

const cache = {};

export function clearCache() {
    Object.keys(cache).forEach(k => delete cache[k]);
}

export async function initializeFS(){
    try{
        await mkdir('', {
            baseDir: BaseDirectory.AppData,
            recursive: true
        });
        
        const files = ['userSettings.json', 'userProfiles.json']
        const fileExist = await exists(files[0], {
            baseDir: BaseDirectory.AppData
        });
        const fileExist2 = await exists(files[1], {
            baseDir: BaseDirectory.AppData
        });
        const defaultSettings = {
            "rainmeter-Path": "",
            "Yasb-Config-Path": "",
            "Yasb-Exe-Path": "",
            "GlazeWM-Config-Path": "",
            "Zebar-Config-Path": ""
        };

        if(!fileExist){
            await writeTextFile(files[0], JSON.stringify(defaultSettings, null, 2), {
                baseDir:BaseDirectory.AppData
            });
        } else {
            const appDataPath = await appDataDir();
            const settingsPath = await join(appDataPath, '', files[0]);
            const contents = await readTextFile(settingsPath);
            const existing = JSON.parse(contents);
            const merged = { ...defaultSettings, ...existing };
            await writeTextFile(settingsPath, JSON.stringify(merged, null, 2));
        }
        if(!fileExist2){
            await writeTextFile(files[1], JSON.stringify({
                profiles:[]
            }, null, 2), {
                baseDir:BaseDirectory.AppData
            });
        }
    }catch(error){
        console.log(error);
    }
}

async function update(fileName, updatedData){
    const appDataPath = await appDataDir();
    const filePath = await join(appDataPath, '', fileName);
    await writeTextFile(filePath, JSON.stringify(updatedData, null, 2))
}

export async function getData(fileName, forceRefresh = false){
    if (!forceRefresh && cache[fileName]) {
        return cache[fileName];
    }
    try{
        const appDataPath = await appDataDir();
        const filePath = await join(appDataPath, '', fileName);
        const contents = await readTextFile(filePath);
        const data = JSON.parse(contents);
        cache[fileName] = data;
        return data;
    }catch(error){
        console.log(error);
    }
}

function bustCache(fileName) {
    delete cache[fileName];
}

export async function addData(fileName, newData){
    try{
        const currentData = await getData(fileName, true);
        const updatedData = {
            ...currentData,
            "profiles": [
                ...currentData.profiles,
                newData
            ]
        };
        update(fileName, updatedData);
        bustCache(fileName);
    }catch(error){
        console.log(error);
    }
}

export async function removeData(fileName, target_id){
    try{
        if(fileName === "userProfiles.json"){
            const currentData = await getData(fileName, true);
            const updatedData = {
                profiles: currentData.profiles.filter(p => p.id != target_id)
            }
            update(fileName, updatedData);
        }else{
            const currentData = await getData(fileName, true);
            if(currentData.hasOwnProperty(target_id) && currentData[target_id] != ""){
                currentData[target_id] = "";
                update(fileName, currentData);
            }
        }
        bustCache(fileName);
    }catch(error){
        console.log(error);
    }
}

export async function editData(fileName, targetedData){
    try{
        if(fileName === "userProfiles.json"){
            const currentData = await getData(fileName, true);
            const updatedData  = {
                profiles: currentData.profiles.map((p) =>{
                    if(p.id == targetedData.id){
                        return targetedData;
                    }
                    return p;
                })
            }
            update(fileName, updatedData);
        }else{
            const currentData = await getData(fileName, true);
            const merged = { ...currentData, ...targetedData };
            update(fileName, merged);
        }
        bustCache(fileName);
    }catch(error){
        console.log(error);
    }
}