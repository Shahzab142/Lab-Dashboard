import { format } from 'date-fns';
import { apiFetch } from './api';
import pptxgen from "pptxgenjs";
import * as XLSX from 'xlsx';
type ReportType = 'GLOBAL' | 'CITY' | 'LAB' | 'SYSTEM' | 'PC';

export async function generateDynamicReport(type: ReportType, data: any, context?: string) {
    try {
        const fileTimestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
        const pres = new pptxgen();
        let fileName = 'Audit_Report';

        // Professional Theme Colors
        const THEME_BLUE = "1e293b";
        const THEME_ORANGE = "f99a1d";
        const TEXT_WHITE = "FFFFFF";

        // Helper to get score safely
        const getScore = (item: any) => {
            const val = item.avg_performance ?? item.avg_score ?? item.cpu_score ?? 0;
            let score = parseFloat(String(val)) || 0;
            if (score > 100) score = score / 100;
            if (score >= 100) score = 99.9;
            return score;
        };

        const addHeader = (slide: any, title: string) => {
            slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.0, fill: { color: THEME_BLUE } });
            slide.addText(title, { x: 0.5, y: 0.2, w: '90%', h: 0.6, fontSize: 24, fontFace: "Segoe UI", color: THEME_ORANGE, bold: true });
            slide.addText(`GENERATE DATE: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, { x: 0.5, y: 0.7, w: '90%', h: 0.2, fontSize: 10, color: TEXT_WHITE, italic: true });
        };

        if (type === 'GLOBAL') {
            const locations = data.locations || [];
            fileName = `Global_Infrastructure_Report_${fileTimestamp}`;

            const slide = pres.addSlide();
            addHeader(slide, "PROVINCIAL INFRASTRUCTURE OVERVIEW");

            const rows = locations.map((loc: any) => [
                { text: loc.city },
                { text: String(loc.total_labs) },
                { text: String(loc.total_pcs) },
                { text: String(loc.online) },
                { text: `${getScore(loc).toFixed(1)}%` }
            ]);

            slide.addTable([
                ["DISTRICT", "TOTAL LABS", "TOTAL PCS", "LIVE", "PERFORMANCE"],
                ...rows
            ], {
                x: 0.5, y: 1.2, w: 9,
                border: { pt: 1, color: "dddddd" },
                fill: { color: "F1F1F1" },
                fontSize: 12,
                headerRow: true,
                headerProps: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true }
            });
        }
        else if (type === 'CITY' || (type === 'SYSTEM' && context && !data.devices)) {
            const labs = data.labs || [];
            const cityName = context || data.city || 'TOTAL SYSTEM';
            fileName = `City_Audit_${(cityName || 'Unknown').replace(/\s+/g, '_')}_${fileTimestamp}`;

            const slide = pres.addSlide();
            addHeader(slide, `${cityName.toUpperCase()} - LAB INFRASTRUCTURE`);

            const rows = labs.map((l: any) => [
                { text: l.lab_name },
                { text: String(l.total_pcs) },
                { text: String(l.online) },
                { text: (getScore(l) * (l.total_pcs || 1)).toFixed(0) },
                { text: `${getScore(l).toFixed(1)}%` }
            ]);

            slide.addTable([
                ["LAB FACILITY", "PCS", "LIVE", "LOAD SCORE", "HEALTH"],
                ...rows
            ], {
                x: 0.5, y: 1.2, w: 9,
                border: { pt: 1, color: "dddddd" },
                fontSize: 11,
                headerRow: true,
                headerProps: { fill: THEME_BLUE, color: TEXT_WHITE, bold: true }
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
            const onlineCount = data.online ?? devices.filter((d: any) => d.status === 'online').length;
            const offlineCount = totalPcs - onlineCount;

            slide1.addText(`Total Infrastructure Nodes: ${totalPcs}`, { x: 1, y: 2, fontSize: 18, color: "333333" });
            slide1.addText(`Active Systems: ${onlineCount}`, { x: 1, y: 2.5, fontSize: 18, color: "2ea043", bold: true });
            slide1.addText(`Offline Systems: ${offlineCount}`, { x: 1, y: 3.0, fontSize: 18, color: "cf222e" });

            // Slide 2: Inventory
            if (devices.length > 0) {
                const slide2 = pres.addSlide();
                addHeader(slide2, `${labName.toUpperCase()} - NODE INVENTORY`);
                const rows = devices.slice(0, 15).map((d: any) => [
                    d.pc_name || 'Station',
                    (d.status || 'offline').toUpperCase(),
                    `${getScore(d).toFixed(1)}%`,
                    d.last_seen ? format(new Date(d.last_seen), 'HH:mm') : 'N/A'
                ]);

                slide2.addTable([
                    ["STATION", "STATUS", "CPU LOAD", "LAST SEEN"],
                    ...rows
                ], { x: 0.5, y: 1.2, w: 9, fontSize: 10, headerProps: { fill: THEME_BLUE, color: TEXT_WHITE } });
            }
        }
        else if (type === 'PC') {
            const device = data;
            fileName = `System_Profile_${(device.pc_name || 'System').replace(/\s+/g, '_')}_${fileTimestamp}`;

            const slide = pres.addSlide();
            addHeader(slide, `SYSTEM PROFILE: ${device.pc_name}`);

            const profileData = [
                ["Property", "Value"],
                ["System ID", device.system_id],
                ["Region", device.city?.toUpperCase() || 'N/A'],
                ["Facility", device.lab_name?.toUpperCase() || 'N/A'],
                ["Status", device.isOnline ? 'ONLINE' : 'OFFLINE'],
                ["Health Score", `${getScore(device).toFixed(1)}%`]
            ];

            slide.addTable(profileData, {
                x: 0.5, y: 1.5, w: 5,
                border: { pt: 1, color: "dddddd" },
                fontSize: 14,
                headerRow: true,
                headerProps: { fill: THEME_BLUE, color: TEXT_WHITE }
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

export const generateDailyReport = (stats: any, locations: any[]) => generateDynamicReport('GLOBAL', { locations });

export async function generateCustomMultiLabReport(selectedData: { city: string, labs: string[], pcs?: Record<string, string[]> }[]) {
    try {
        const fileTimestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
        const pres = new pptxgen();
        const fileName = `Bulk_Report_${fileTimestamp}`;
        let hasData = false;

        for (const cityData of selectedData) {
            for (const labName of cityData.labs) {
                const response = await apiFetch(`/devices?city=${cityData.city}&lab=${labName}`);
                let devices = response?.devices || [];

                const selectedPcsForLab = cityData.pcs?.[labName];
                if (selectedPcsForLab && selectedPcsForLab.length > 0) {
                    devices = devices.filter((d: any) => selectedPcsForLab.includes(d.system_id));
                }

                if (devices.length > 0) {
                    hasData = true;
                    const slide = pres.addSlide();

                    // Header
                    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.0, fill: { color: "000000" } });
                    slide.addText(`Bulk Report: ${labName}`, { x: 0.5, y: 0.3, w: '90%', h: 0.4, fontSize: 18, color: "f99a1d", bold: true });
                    slide.addText(`CITY: ${cityData.city} | DATE: ${fileTimestamp}`, { x: 0.5, y: 0.7, w: '90%', h: 0.2, fontSize: 8, color: "FFFFFF" });

                    const rows = devices.slice(0, 15).map((d: any) => {
                        let score = parseFloat(d.avg_performance || d.cpu_score) || 0;
                        if (score > 100) score = score / 100;
                        if (score >= 100) score = 99.9;

                        return [
                            d.pc_name,
                            d.hardware_id?.substring(0, 12) || 'N/A',
                            d.status?.toUpperCase() || 'N/A',
                            `${score.toFixed(1)}%`
                        ];
                    });

                    const tableHeader = [
                        { text: "PC NAME", options: { fill: "000000", color: "FFFFFF", bold: true, fontSize: 12 } },
                        { text: "ID", options: { fill: "000000", color: "FFFFFF", bold: true, fontSize: 12 } },
                        { text: "STATUS", options: { fill: "000000", color: "FFFFFF", bold: true, fontSize: 12 } },
                        { text: "CPU PERFORMANCE", options: { fill: "000000", color: "FFFFFF", bold: true, fontSize: 12 } }
                    ];

                    slide.addTable([
                        tableHeader as any,
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

export async function generateDynamicExcelReport(type: ReportType, data: any, context?: string) {
    try {
        const fileTimestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
        let fileName = 'Audit_Report';
        let excelData: any[] = [];

        const getScoreStr = (item: any) => {
            const val = item.avg_performance ?? item.avg_score ?? item.cpu_score ?? 0;
            let score = parseFloat(String(val)) || 0;
            if (score > 100) score = score / 100;
            if (score >= 100) score = 99.9;
            return `${score.toFixed(1)}%`;
        };
        const getScoreRaw = (item: any) => {
            const val = item.avg_performance ?? item.avg_score ?? item.cpu_score ?? 0;
            let score = parseFloat(String(val)) || 0;
            if (score > 100) score = score / 100;
            if (score >= 100) score = 99.9;
            return score;
        };

        if (type === 'GLOBAL') {
            const locations = data.locations || [];
            fileName = `Global_Infrastructure_Report_${fileTimestamp}`;
            excelData.push(["DISTRICT", "TOTAL LABS", "TOTAL PCS", "LIVE", "PERFORMANCE"]);
            locations.forEach((loc: any) => {
                excelData.push([loc.city, loc.total_labs, loc.total_pcs, loc.online, getScoreStr(loc)]);
            });
        }
        else if (type === 'CITY' || (type === 'SYSTEM' && context && !data.devices)) {
            const labs = data.labs || [];
            const cityName = context || data.city || 'TOTAL SYSTEM';
            fileName = `City_Audit_${(cityName || 'Unknown').replace(/\s+/g, '_')}_${fileTimestamp}`;
            excelData.push(["LAB FACILITY", "PCS", "LIVE", "LOAD SCORE", "HEALTH"]);
            labs.forEach((l: any) => {
                excelData.push([l.lab_name, l.total_pcs, l.online, (getScoreRaw(l) * (l.total_pcs || 1)).toFixed(0), getScoreStr(l)]);
            });
        }
        else if (type === 'LAB' || (type === 'SYSTEM' && data.devices)) {
            const devices = data.devices || [];
            const labName = context || data.lab || 'GLOBAL FLEET';
            fileName = `Lab_Audit_${(labName || 'Unknown').replace(/\s+/g, '_')}_${fileTimestamp}`;

            const totalPcs = data.total_pcs ?? devices.length;
            const onlineCount = data.online ?? devices.filter((d: any) => d.status === 'online').length;
            const offlineCount = totalPcs - onlineCount;

            excelData.push([`${labName.toUpperCase()} - SUMMARY`]);
            excelData.push(["Total Infrastructure Nodes", totalPcs]);
            excelData.push(["Active Systems", onlineCount]);
            excelData.push(["Offline Systems", offlineCount]);
            excelData.push([]);

            if (devices.length > 0) {
                excelData.push(["STATION", "STATUS", "CPU LOAD", "LAST SEEN"]);
                devices.forEach((d: any) => {
                    excelData.push([
                        d.pc_name || 'Station',
                        (d.status || 'offline').toUpperCase(),
                        getScoreStr(d),
                        d.last_seen ? format(new Date(d.last_seen), 'HH:mm') : 'N/A'
                    ]);
                });
            }
        }
        else if (type === 'PC') {
            const device = data;
            fileName = `System_Profile_${(device.pc_name || 'System').replace(/\s+/g, '_')}_${fileTimestamp}`;
            excelData.push(["Property", "Value"]);
            excelData.push(["System ID", device.system_id]);
            excelData.push(["Region", device.city?.toUpperCase() || 'N/A']);
            excelData.push(["Facility", device.lab_name?.toUpperCase() || 'N/A']);
            excelData.push(["Status", device.isOnline ? 'ONLINE' : 'OFFLINE']);
            excelData.push(["Health Score", getScoreStr(device)]);
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
        let excelData: any[] = [];

        const getScoreStr = (d: any) => {
            let score = parseFloat(d.avg_performance || d.cpu_score) || 0;
            if (score > 100) score = score / 100;
            if (score >= 100) score = 99.9;
            return `${score.toFixed(1)}%`;
        };

        for (const cityData of selectedData) {
            for (const labName of cityData.labs) {
                const response = await apiFetch(`/devices?city=${cityData.city}&lab=${labName}`);
                let devices = response?.devices || [];

                const selectedPcsForLab = cityData.pcs?.[labName];
                if (selectedPcsForLab && selectedPcsForLab.length > 0) {
                    devices = devices.filter((d: any) => selectedPcsForLab.includes(d.system_id));
                }

                if (devices.length > 0) {
                    hasData = true;
                    excelData.push([`Bulk Report: ${labName}`]);
                    excelData.push([`CITY: ${cityData.city}`, `DATE: ${fileTimestamp}`]);
                    excelData.push([]);
                    excelData.push(["PC NAME", "ID", "STATUS", "CPU PERFORMANCE"]);

                    devices.forEach((d: any) => {
                        excelData.push([
                            d.pc_name,
                            d.hardware_id?.substring(0, 12) || 'N/A',
                            d.status?.toUpperCase() || 'N/A',
                            getScoreStr(d)
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
