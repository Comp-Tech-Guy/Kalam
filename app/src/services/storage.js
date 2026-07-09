import {mkdir, exists, writeTextFile, readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";

const cache = {};

export function clearCache() {
    Object.keys(cache).forEach(k => delete cache[k]);
}

export async function initializeFS(){
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
        "onboardingComplete": false,
        "rainmeter-Path": "",
        "Yasb-Config-Path": "",
        "Yasb-Exe-Path": "",
        "GlazeWM-Config-Path": "",
        "Zebar-Config-Path": "",
        "Windhawk-Type": "Installed",
        "Windhawk-Path": ""
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
}

async function update(fileName, updatedData){
    const appDataPath = await appDataDir();
    const filePath = await join(appDataPath, '', fileName);
    await writeTextFile(filePath, JSON.stringify(updatedData, null, 2));
}

export async function getData(fileName, forceRefresh = false){
    if (!forceRefresh && cache[fileName]) {
        return cache[fileName];
    }
    const appDataPath = await appDataDir();
    const filePath = await join(appDataPath, '', fileName);
    const contents = await readTextFile(filePath);
    const data = JSON.parse(contents);
    cache[fileName] = data;
    return data;
}

function bustCache(fileName) {
    delete cache[fileName];
}

export async function addData(fileName, newData){
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
}

export async function removeData(fileName, target_id){
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
}

export async function editData(fileName, targetedData){
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
}

export async function setOnboardingComplete(value = true) {
    const currentData = await getData('userSettings.json', true);
    const updated = { ...currentData, onboardingComplete: value };
    const appDataPath = await appDataDir();
    const filePath = await join(appDataPath, '', 'userSettings.json');
    await writeTextFile(filePath, JSON.stringify(updated, null, 2));
    bustCache('userSettings.json');
}

export function exportProfile(profile) {
    return JSON.stringify(profile, null, 2);
}

export async function exportAllProfiles() {
    const data = await getData('userProfiles.json', true);
    return JSON.stringify(data, null, 2);
}

export async function importSingleProfile(profileData) {
    const newProfile = { ...profileData, id: Date.now() };
    await addData('userProfiles.json', newProfile);
}

export async function importAllProfiles(profiles) {
    const currentData = await getData('userProfiles.json', true);
    const existingIds = new Set(currentData.profiles.map(p => p.id));
    let idGen = Date.now();
    const merged = {
        profiles: [
            ...currentData.profiles,
            ...profiles.map(p => {
                if (!existingIds.has(p.id)) {
                    return p;
                }
                return { ...p, id: ++idGen };
            })
        ]
    };
    update('userProfiles.json', merged);
    bustCache('userProfiles.json');
}