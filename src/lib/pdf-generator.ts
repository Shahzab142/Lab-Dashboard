import { format } from 'date-fns';
import { apiFetch } from './api';
import pptxgen from "pptxgenjs";
import * as XLSX from 'xlsx';

type ReportType = 'GLOBAL' | 'CITY' | 'LAB' | 'SYSTEM' | 'PC';

interface AppUsage {
    [key: string]: number;
}

interface Device {
    system_id: string;
    pc_name?: string;
    status?: string;
    isOnline?: boolean;
    app_usage?: AppUsage;
    last_seen?: string;
    hardware_id?: string;
    city?: string;
    lab_name?: string;
}

interface Lab {
    lab_name: string;
    total_pcs: number;
    online: number;
    app_usage?: AppUsage;
}

interface Location {
    city: string;
    total_labs: number;
    total_pcs: number;
    online: number;
    app_usage?: AppUsage;
}

export async function generateDynamicReport(type: ReportType, data: { locations?: Location[], labs?: Lab[], devices?: Device[], city?: string, lab?: string, total_pcs?: number, online?: number } & Partial<Device>, context?: string) {
    try {
        const fileTimestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
        const pres = new pptxgen();
        let fileName = 'Audit_Report';

        // Professional Theme Colors
        const THEME_BLUE = "1e293b";
        const THEME_ORANGE = "f99a1d";
        const TEXT_WHITE = "FFFFFF";

        // Helper to get active apps count safely
        const getAppCount = (item: Device | Lab | Location) => {
            const apps = item.app_usage || {};
            return Object.keys(apps).length;
        };

        const addHeader = (slide: pptxgen.Slide, title: string) => {
            slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.0, fill: { color: THEME_BLUE } });
            slide.addText(title, { x: 0.5, y: 0.2, w: '90%', h: 0.6, fontSize: 24, fontFace: "Segoe UI", color: THEME_ORANGE, bold: true });
            slide.addText(`GENERATE DATE: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, { x: 0.5, y: 0.7, w: '90%', h: 0.2, fontSize: 10, color: TEXT_WHITE, italic: true });
        };

        if (type === 'GLOBAL') {
            const locations = data.locations || [];
            fileName = `Global_Infrastructure_Report_${fileTimestamp}`;

            const slide = pres.addSlide();
            addHeader(slide, "PROVINCIAL INFRASTRUCTURE OVERVIEW");

            const rows = locations.map((loc: Location) => [
                { text: loc.city },
                { text: String(loc.total_labs) },
                { text: String(loc.total_pcs) },
                { text: String(loc.online) },
                { text: String(getAppCount(loc)) }
            ]);

            slide.addTable([
                [
                    { text: "DISTRICT", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } },
                    { text: "TOTAL LABS", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } },
                    { text: "TOTAL PCS", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } },
                    { text: "LIVE", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } },
                    { text: "APP ACTIVITY", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } }
                ],
                ...rows
            ], {
                x: 0.5, y: 1.2, w: 9,
                border: { pt: 1, color: "dddddd" },
                fill: { color: "F1F1F1" },
                fontSize: 12
            });
        }
        else if (type === 'CITY' || (type === 'SYSTEM' && context && !data.devices)) {
            const labs = data.labs || [];
            const cityName = context || data.city || 'TOTAL SYSTEM';
            fileName = `City_Audit_${(cityName || 'Unknown').replace(/\s+/g, '_')}_${fileTimestamp}`;

            const slide = pres.addSlide();
            addHeader(slide, `${cityName.toUpperCase()} - LAB INFRASTRUCTURE`);

            const rows = labs.map((l: Lab) => [
                { text: l.lab_name },
                { text: String(l.total_pcs) },
                { text: String(l.online) },
                { text: String(getAppCount(l)) },
                { text: l.online > 0 ? "NOMINAL" : "OFFLINE" }
            ]);

            slide.addTable([
                [
                    { text: "LAB FACILITY", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } },
                    { text: "PCS", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } },
                    { text: "LIVE", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } },
                    { text: "ACTIVE APPS", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } },
                    { text: "STATUS", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } }
                ],
                ...rows
            ], {
                x: 0.5, y: 1.2, w: 9,
                border: { pt: 1, color: "dddddd" },
                fontSize: 11
            });
        }
        else if (type === 'LAB' || (type === 'SYSTEM' && data.devices)) {
            const devices = data.devices || [];
            const labName = context || data.lab || 'GLOBAL FLEET';
            fileName = `Lab_Audit_${(labName || 'Unknown').replace(/\s+/g, '_')}_${fileTimestamp}`;

            // Slide 1: Summary
            const slide1 = pres.addSlide();
            addHeader(slide1, `${labName.toUpperCase()} - SUMMARY`);

            const totalPcs = data.total_pcs ?? devices.length;
            const onlineCount = data.online ?? devices.filter((d: Device) => d.status === 'online').length;
            const offlineCount = totalPcs - onlineCount;

            slide1.addText(`Total Infrastructure Nodes: ${totalPcs}`, { x: 1, y: 2, fontSize: 18, color: "333333" });
            slide1.addText(`Active Systems: ${onlineCount}`, { x: 1, y: 2.5, fontSize: 18, color: "2ea043", bold: true });
            slide1.addText(`Offline Systems: ${offlineCount}`, { x: 1, y: 3.0, fontSize: 18, color: "cf222e" });

            // Slide 2: Inventory
            if (devices.length > 0) {
                const slide2 = pres.addSlide();
                addHeader(slide2, `${labName.toUpperCase()} - NODE INVENTORY`);
                const rows = devices.slice(0, 15).map((d: Device) => [
                    d.pc_name || 'Station',
                    (d.status || 'offline').toUpperCase(),
                    String(getAppCount(d)),
                    d.last_seen ? format(new Date(d.last_seen), 'HH:mm') : 'N/A'
                ]);

                slide2.addTable([
                    [
                        { text: "STATION", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } },
                        { text: "STATUS", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } },
                        { text: "ACTIVE APPS", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } },
                        { text: "LAST SEEN", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } }
                    ],
                    ...rows
                ], { x: 0.5, y: 1.2, w: 9, fontSize: 10 });
            }
        }
        else if (type === 'PC') {
            const device = data as Device;
            fileName = `System_Profile_${(device.pc_name || 'System').replace(/\s+/g, '_')}_${fileTimestamp}`;

            const slide = pres.addSlide();
            addHeader(slide, `SYSTEM PROFILE: ${device.pc_name}`);

            const profileData = [
                [
                    { text: "Property", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } },
                    { text: "Value", options: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true } }
                ],
                ["System ID", device.system_id || 'N/A'],
                ["Region", device.city?.toUpperCase() || 'N/A'],
                ["Facility", device.lab_name?.toUpperCase() || 'N/A'],
                ["Status", device.isOnline ? 'ONLINE' : 'OFFLINE']
            ];

            slide.addTable(profileData, {
                x: 0.5, y: 1.5, w: 5,
                border: { pt: 1, color: "dddddd" },
                fontSize: 14
            });
        }

        // SAVE POWERPOINT
        await pres.writeFile({ fileName: `${fileName}.pptx` });
        return true;
    } catch (error) {
        console.error("PowerPoint Generation Error:", error);
        throw error;
    }
}

export const generateDailyReport = (stats: unknown, locations: Location[]) => generateDynamicReport('GLOBAL', { locations });

export async function generateCustomMultiLabReport(selectedData: { city: string, labs: string[], pcs?: Record<string, string[]> }[]) {
    try {
        const fileTimestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
        const pres = new pptxgen();
        const fileName = `Bulk_Report_${fileTimestamp}`;
        let hasData = false;

        for (const cityData of selectedData) {
            for (const labName of cityData.labs) {
                const response = await apiFetch(`/devices?city=${cityData.city}&lab=${labName}`);
                let devices: Device[] = response?.devices || [];

                const selectedPcsForLab = cityData.pcs?.[labName];
                if (selectedPcsForLab && selectedPcsForLab.length > 0) {
                    devices = devices.filter((d: Device) => selectedPcsForLab.includes(d.system_id));
                }

                if (devices.length > 0) {
                    hasData = true;
                    const slide = pres.addSlide();

                    // Header
                    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.0, fill: { color: "000000" } });
                    slide.addText(`Bulk Report: ${labName}`, { x: 0.5, y: 0.3, w: '90%', h: 0.4, fontSize: 18, color: "f99a1d", bold: true });
                    slide.addText(`CITY: ${cityData.city} | DATE: ${fileTimestamp}`, { x: 0.5, y: 0.7, w: '90%', h: 0.2, fontSize: 8, color: "FFFFFF" });

                    const rows = devices.slice(0, 15).map((d: Device) => {
                        const appCount = Object.keys(d.app_usage || {}).length;

                        return [
                            d.pc_name || 'Station',
                            d.hardware_id?.substring(0, 12) || 'N/A',
                            d.status?.toUpperCase() || 'N/A',
                            String(appCount)
                        ];
                    });

                    const tableHeader = [
                        { text: "PC NAME", options: { fill: "000000", color: "FFFFFF", bold: true, fontSize: 12 } },
                        { text: "ID", options: { fill: "000000", color: "FFFFFF", bold: true, fontSize: 12 } },
                        { text: "STATUS", options: { fill: "000000", color: "FFFFFF", bold: true, fontSize: 12 } },
                        { text: "ACTIVE APPS", options: { fill: "000000", color: "FFFFFF", bold: true, fontSize: 12 } }
                    ];

                    slide.addTable([
                        tableHeader as pptxgen.TableRow,
                        ...rows
                    ], {
                        x: 0.5, y: 1.2, w: 9,
                        border: { pt: 1, color: "cccccc" },
                        fontSize: 10,
                    });
                }
            }
        }

        if (hasData) {
            await pres.writeFile({ fileName: `${fileName}.pptx` });
            return true;
        } else {
            console.warn("No data found to generate PowerPoint report.");
            return false;
        }
    } catch (error) {
        console.error("Custom PowerPoint Generation Error:", error);
        throw error;
    }
}

export async function generateDynamicExcelReport(type: ReportType, data: { locations?: Location[], labs?: Lab[], devices?: Device[], city?: string, lab?: string, total_pcs?: number, online?: number } & Partial<Device>, context?: string) {
    try {
        const fileTimestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
        let fileName = 'Audit_Report';
        const excelData: (string|number)[][] = [];

        const getAppCount = (item: Device | Lab | Location) => {
            return Object.keys(item.app_usage || {}).length;
        };

        if (type === 'GLOBAL') {
            const locations = data.locations || [];
            fileName = `Global_Infrastructure_Report_${fileTimestamp}`;
            excelData.push(["DISTRICT", "TOTAL LABS", "TOTAL PCS", "LIVE", "APP ACTIVITY"]);
            locations.forEach((loc: Location) => {
                excelData.push([loc.city, loc.total_labs, loc.total_pcs, loc.online, getAppCount(loc)]);
            });
        }
        else if (type === 'CITY' || (type === 'SYSTEM' && context && !data.devices)) {
            const labs = data.labs || [];
            const cityName = context || data.city || 'TOTAL SYSTEM';
            fileName = `City_Audit_${(cityName || 'Unknown').replace(/\s+/g, '_')}_${fileTimestamp}`;
            excelData.push(["LAB FACILITY", "PCS", "LIVE", "ACTIVE APPS", "STATUS"]);
            labs.forEach((l: Lab) => {
                excelData.push([l.lab_name, l.total_pcs, l.online, getAppCount(l), l.online > 0 ? "NOMINAL" : "OFFLINE"]);
            });
        }
        else if (type === 'LAB' || (type === 'SYSTEM' && data.devices)) {
            const devices = data.devices || [];
            const labName = context || data.lab || 'GLOBAL FLEET';
            fileName = `Lab_Audit_${(labName || 'Unknown').replace(/\s+/g, '_')}_${fileTimestamp}`;

            const totalPcs = data.total_pcs ?? devices.length;
            const onlineCount = data.online ?? devices.filter((d: Device) => d.status === 'online').length;
            const offlineCount = totalPcs - onlineCount;

            excelData.push([`${labName.toUpperCase()} - SUMMARY`]);
            excelData.push(["Total Infrastructure Nodes", totalPcs]);
            excelData.push(["Active Systems", onlineCount]);
            excelData.push(["Offline Systems", offlineCount]);
            excelData.push([]);

            if (devices.length > 0) {
                excelData.push(["STATION", "STATUS", "ACTIVE APPS", "LAST SEEN"]);
                devices.forEach((d: Device) => {
                    excelData.push([
                        d.pc_name || 'Station',
                        (d.status || 'offline').toUpperCase(),
                        getAppCount(d),
                        d.last_seen ? format(new Date(d.last_seen), 'HH:mm') : 'N/A'
                    ]);
                });
            }
        }
        else if (type === 'PC') {
            const device = data as Device;
            fileName = `System_Profile_${(device.pc_name || 'System').replace(/\s+/g, '_')}_${fileTimestamp}`;
            excelData.push(["Property", "Value"]);
            excelData.push(["System ID", device.system_id || 'N/A']);
            excelData.push(["Region", device.city?.toUpperCase() || 'N/A']);
            excelData.push(["Facility", device.lab_name?.toUpperCase() || 'N/A']);
            excelData.push(["Status", device.isOnline ? 'ONLINE' : 'OFFLINE']);
        }

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Audit Report");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
        return true;
    } catch (error) {
        console.error("Excel Generation Error:", error);
        throw error;
    }
}

export async function generateCustomMultiLabExcelReport(selectedData: { city: string, labs: string[], pcs?: Record<string, string[]> }[]) {
    try {
        const fileTimestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
        const fileName = `Bulk_Report_${fileTimestamp}`;
        let hasData = false;
        const excelData: (string|number)[][] = [];

        const getAppCount = (d: Device) => {
            return Object.keys(d.app_usage || {}).length;
        };

        for (const cityData of selectedData) {
            for (const labName of cityData.labs) {
                const response = await apiFetch(`/devices?city=${cityData.city}&lab=${labName}`);
                let devices: Device[] = response?.devices || [];

                const selectedPcsForLab = cityData.pcs?.[labName];
                if (selectedPcsForLab && selectedPcsForLab.length > 0) {
                    devices = devices.filter((d: Device) => selectedPcsForLab.includes(d.system_id));
                }

                if (devices.length > 0) {
                    hasData = true;
                    excelData.push([`Bulk Report: ${labName}`]);
                    excelData.push([`CITY: ${cityData.city}`, `DATE: ${fileTimestamp}`]);
                    excelData.push([]);
                    excelData.push(["PC NAME", "ID", "STATUS", "ACTIVE APPS"]);

                    devices.forEach((d: Device) => {
                        excelData.push([
                            d.pc_name || 'Station',
                            d.hardware_id?.substring(0, 12) || 'N/A',
                            d.status?.toUpperCase() || 'N/A',
                            getAppCount(d)
                        ]);
                    });

                    excelData.push([]); // blank line between datasets
                    excelData.push([]);
                }
            }
        }

        if (hasData) {
            const ws = XLSX.utils.aoa_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Bulk Audit Report");
            XLSX.writeFile(wb, `${fileName}.xlsx`);
            return true;
        } else {
            console.warn("No data found to generate Excel report.");
            return false;
        }
    } catch (error) {
        console.error("Custom Excel Generation Error:", error);
        throw error;
    }
}

