import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "@/lib/api";
import { FileText, Loader2, ChevronRight, Globe, Beaker, Monitor, Landmark, Activity } from "lucide-react";
import { toast } from "sonner";
import { generateCustomMultiLabReport, generateCustomMultiLabExcelReport } from "@/lib/pdf-generator";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PUNJAB_HIERARCHY } from "@/lib/locationHierarchy";

const punjabCities = [
    { name: "Abdul Hakeem" }, { name: "Ahmadpur East" }, { name: "Ahmadpur Sial" }, { name: "Ahmed Nager Chatha" },
    { name: "Alipur" }, { name: "Alipur Chatha" }, { name: "Arifwala" }, { name: "Athara Hazari" },
    { name: "Attock" }, { name: "Baddomalhi" }, { name: "Bahawalnagar" }, { name: "Bahawalpur" },
    { name: "Bhalwal" }, { name: "Bhakkar" }, { name: "Bhawana" }, { name: "Bhera" },
    { name: "Burewala" }, { name: "Chak Azam Saffar" }, { name: "Chak Jhumra" }, { name: "Chakwal" },
    { name: "Chichawatni" }, { name: "Chiniot" }, { name: "Chishtian" }, { name: "Choa Saidan Shah" },
    { name: "Dahr Ranwan" }, { name: "Darya Khan" }, { name: "Daska" }, { name: "Dera Ghazi Khan" },
    { name: "Dhaular" }, { name: "Dina" }, { name: "Dinga" }, { name: "Dipalpur" },
    { name: "Dunyapur" }, { name: "Faisalabad" }, { name: "Fateh Jang" }, { name: "Fazilpur" },
    { name: "Fort Abbas" }, { name: "Ghakhar Mandi" }, { name: "Gojra" }, { name: "Gujar Khan" },
    { name: "Gujranwala" }, { name: "Gujrat" }, { name: "Hadali" }, { name: "Hafizabad" },
    { name: "Harnoli" }, { name: "Haroonabad" }, { name: "Hasilpur" }, { name: "Hassan Abdal" },
    { name: "Haveli Lakha" }, { name: "Hazro" }, { name: "Hujra Shah Muqeem" }, { name: "Islampur" },
    { name: "Jahanian" }, { name: "Jalalpur Jattan" }, { name: "Jalalpur Pirwala" }, { name: "Jampur" },
    { name: "Jand" }, { name: "Jandanwala" }, { name: "Jaranwala" }, { name: "Jauharabad" },
    { name: "Jhang" }, { name: "Jhelum" }, { name: "Kabirwala" }, { name: "Kahror Pacca" },
    { name: "Kalabagh" }, { name: "Kalaswala" }, { name: "Kallar Kahar" }, { name: "Kallar Syedan" },
    { name: "Kalur Kot" }, { name: "Kamalia" }, { name: "Kamoke" }, { name: "Karor Lal Esan" },
    { name: "Kashmor" }, { name: "Kasur" }, { name: "Khairpur Tamewali" }, { name: "Khanewal" },
    { name: "Khangarh" }, { name: "Khanpur" }, { name: "Kharian" }, { name: "Khewra" },
    { name: "Khurrianwala" }, { name: "Khushab" }, { name: "Kot Adu" }, { name: "Kot Mithan" },
    { name: "Kot Momin" }, { name: "Kot Radha Kishan" }, { name: "Kot Samaba" }, { name: "Kot Sultan" },
    { name: "Kunda" }, { name: "Kunjah" }, { name: "Ladhewala Waraich" }, { name: "Lahore" },
    { name: "Lalamusa" }, { name: "Lalian" }, { name: "Layyah" }, { name: "Liaquat Pur" },
    { name: "Lodhran" }, { name: "Ludhewala" }, { name: "Mailsi" }, { name: "Malakwal" },
    { name: "Mamoori" }, { name: "Mandi Bahauddin" }, { name: "Mandi Warburton" }, { name: "Mankera" },
    { name: "Mari" }, { name: "Mian Channu" }, { name: "Mianwali" }, { name: "Minchanabad" },
    { name: "Mitha Tiwana" }, { name: "Multan" }, { name: "Muridke" }, { name: "Murree" },
    { name: "Mustafabad" }, { name: "Muzaffargarh" }, { name: "Nankana Sahib" }, { name: "Narang" },
    { name: "Narowal" }, { name: "Naushera" }, { name: "Noorpur Thal" }, { name: "Nowshera Virkan" },
    { name: "Okara" }, { name: "Pakpattan" }, { name: "Pasrur" }, { name: "Pattoki" },
    { name: "Phalia" }, { name: "Pindi Bhattian" }, { name: "Pindi Gheb" }, { name: "Pir Mahal" },
    { name: "Qila Didar Singh" }, { name: "Qila Sobha Singh" }, { name: "Rabwah" }, { name: "Raiwind" },
    { name: "Rajanpur" }, { name: "Rahim Yar Khan" }, { name: "Rawalpindi" }, { name: "Renala Khurd" },
    { name: "Rojhan" }, { name: "Sadiqabad" }, { name: "Safdarabad" }, { name: "Sahiwal" },
    { name: "Samberial" }, { name: "Sangla Hill" }, { name: "Sarai Alamgir" }, { name: "Sarai Sidhu" },
    { name: "Sargodha" }, { name: "Shahkot" }, { name: "Shahpur" }, { name: "Shakargarh" },
    { name: "Sheikhupura" }, { name: "Sher Shah" }, { name: "Shorkot" }, { name: "Shujaabad" },
    { name: "Sialkot" }, { name: "Sillanwali" }, { name: "Sohawa" }, { name: "Soianwala" },
    { name: "Tandlianwala" }, { name: "Talagang" }, { name: "Taranda Aurat" }, { name: "Taunsa Sharif" },
    { name: "Taxila" }, { name: "Tiba Sultanpur" }, { name: "Toba Tek Singh" }, { name: "Tulamba" },
    { name: "Uch Sharif" }, { name: "Vehari" }, { name: "Wah Cantonment" }, { name: "Wazirabad" },
    { name: "Yazman" }, { name: "Zafarwal" }, { name: "Zahir Pir" }
];

export function GeneratePDFDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState<any[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);

    // Tehsil States
    const [tehsilsByCity, setTehsilsByCity] = useState<Record<string, string[]>>({});
    const [selectedTehsils, setSelectedTehsils] = useState<Record<string, string[]>>({}); // city -> tehsil[]

    const [labsByCity, setLabsByCity] = useState<Record<string, any[]>>({});
    const [selectedLabs, setSelectedLabs] = useState<Record<string, string[]>>({}); // city-tehsil -> lab[]
    const [fetchingLabs, setFetchingLabs] = useState<string[]>([]);

    const [pcsByLab, setPcsByLab] = useState<Record<string, any[]>>({});
    const [selectedPCs, setSelectedPCs] = useState<Record<string, string[]>>({}); // Keyed by lab_name
    const [fetchingPCs, setFetchingPCs] = useState<string[]>([]);

    // Quick Select States
    const [qsDistrict, setQsDistrict] = useState<string>("");
    const [qsTehsil, setQsTehsil] = useState<string>("");
    const [qsLab, setQsLab] = useState<string>("");
    const [qsPC, setQsPC] = useState<string>("");
    const [qsPCsList, setQsPCsList] = useState<any[]>([]);
    const [fetchingQsPCs, setFetchingQsPCs] = useState(false);

    useEffect(() => {
        if (open) {
            // Reset all selections to ensure a clean state
            setSelectedCities([]);
            setSelectedTehsils({});
            setSelectedLabs({});
            setSelectedPCs({});
            setQsDistrict("");
            setQsTehsil("");
            setQsLab("");
            setQsPC("");

            fetchCities();
        }
    }, [open]);

    const fetchCities = async () => {
        try {
            const response = await apiFetch("/stats/locations");
            const apiCities = response.locations || [];

            // Merge punjabCities with API data to show lab counts where available
            const mergedCities = punjabCities.map(pc => {
                const apiMatch = apiCities.find((ac: any) => ac.city.toLowerCase() === pc.name.toLowerCase());
                return {
                    city: pc.name,
                    total_labs: apiMatch ? apiMatch.total_labs : 0
                };
            }).sort((a, b) => b.total_labs - a.total_labs); // Show cities with labs at top

            setCities(mergedCities);
        } catch (error) {
            console.error("Failed to fetch cities", error);
            // Fallback to static list if API fails
            setCities(punjabCities.map(pc => ({ city: pc.name, total_labs: 0 })));
        }
    };

    const toggleCity = async (cityName: string) => {
        const isSelected = selectedCities.includes(cityName);
        if (isSelected) {
            setSelectedCities(prev => prev.filter(c => c !== cityName));

            // 1. Cleanup Tehsils
            const newSelectedTehsils = { ...selectedTehsils };
            delete newSelectedTehsils[cityName];
            setSelectedTehsils(newSelectedTehsils);

            // 2. Cleanup Labs - Remove all entries starting with this city
            const newSelectedLabs = { ...selectedLabs };
            Object.keys(newSelectedLabs).forEach(key => {
                if (key.startsWith(`${cityName}-`)) {
                    // Collect lab names to cleanup PCs
                    const labsToCleanup = newSelectedLabs[key] || [];
                    const newSelectedPCs = { ...selectedPCs };
                    labsToCleanup.forEach(lab => delete newSelectedPCs[lab]);
                    setSelectedPCs(newSelectedPCs);

                    delete newSelectedLabs[key];
                }
            });
            setSelectedLabs(newSelectedLabs);
        } else {
            setSelectedCities(prev => [...prev, cityName]);
            if (!labsByCity[cityName]) {
                fetchLabsAndTehsilsForCity(cityName);
            }
        }
    };

    const fetchLabsAndTehsilsForCity = async (cityName: string) => {
        setFetchingLabs(prev => [...prev, cityName]);
        try {
            const response = await apiFetch(`/stats/city/${cityName}/labs`);
            const labs = response.labs || [];

            // Group labs into city state
            setLabsByCity(prev => ({ ...prev, [cityName]: labs }));

            // Extract unique tehsils
            const tehsils = [...new Set(labs.map((l: any) => l.tehsil || "Unknown"))];
            setTehsilsByCity(prev => ({ ...prev, [cityName]: tehsils }));
            // Manual selection required, no auto-select here

        } catch (error) {
            toast.error(`Failed to fetch labs for ${cityName}`);
        } finally {
            setFetchingLabs(prev => prev.filter(c => c !== cityName));
        }
    };

    const toggleTehsil = (cityName: string, tehsilName: string) => {
        const currentSelected = selectedTehsils[cityName] || [];
        const isSelected = currentSelected.includes(tehsilName);

        if (isSelected) {
            setSelectedTehsils(prev => ({
                ...prev,
                [cityName]: currentSelected.filter(t => t !== tehsilName)
            }));

            // Cleanup labs and their PCs for this specific tehsil
            const key = `${cityName}-${tehsilName}`;
            const labsToCleanup = selectedLabs[key] || [];

            const newSelectedPCs = { ...selectedPCs };
            labsToCleanup.forEach(lab => delete newSelectedPCs[lab]);
            setSelectedPCs(newSelectedPCs);

            const newSelectedLabs = { ...selectedLabs };
            delete newSelectedLabs[key];
            setSelectedLabs(newSelectedLabs);
        } else {
            setSelectedTehsils(prev => ({
                ...prev,
                [cityName]: [...currentSelected, tehsilName]
            }));
            // Selection is now manual, so we don't auto-select labs anymore
        }
    };

    const toggleLab = (cityName: string, tehsilName: string, labName: string) => {
        const key = `${cityName}-${tehsilName}`;
        const currentLabs = selectedLabs[key] || [];
        const isSelected = currentLabs.includes(labName);

        if (isSelected) {
            setSelectedLabs(prev => ({
                ...prev,
                [key]: currentLabs.filter(l => l !== labName)
            }));
            const newSelectedPCs = { ...selectedPCs };
            delete newSelectedPCs[labName];
            setSelectedPCs(newSelectedPCs);
        } else {
            setSelectedLabs(prev => ({
                ...prev,
                [key]: [...currentLabs, labName]
            }));
            if (!pcsByLab[labName]) {
                fetchPCsForLab(cityName, labName);
            }
        }
    };

    const fetchPCsForLab = async (cityName: string, labName: string) => {
        setFetchingPCs(prev => [...prev, labName]);
        try {
            const response = await apiFetch(`/devices?city=${cityName}&lab=${labName}`);
            const devices = response.devices || [];
            setPcsByLab(prev => ({ ...prev, [labName]: devices }));
            // Selection is now manual, so we don't auto-select PCs anymore
        } catch (error) {
            toast.error(`Failed to fetch PCs for ${labName}`);
        } finally {
            setFetchingPCs(prev => prev.filter(l => l !== labName));
        }
    };

    const togglePC = (labName: string, pcId: string) => {
        const currentPCs = selectedPCs[labName] || [];
        if (currentPCs.includes(pcId)) {
            setSelectedPCs(prev => ({
                ...prev,
                [labName]: currentPCs.filter(id => id !== pcId)
            }));
        } else {
            setSelectedPCs(prev => ({
                ...prev,
                [labName]: [...currentPCs, pcId]
            }));
        }
    };

    const handleSelectAllPCsForLab = (labName: string) => {
        const allPCsInLab = (pcsByLab[labName] || []).map((d: any) => d.system_id);
        const currentSelected = selectedPCs[labName] || [];

        if (currentSelected.length === allPCsInLab.length) {
            setSelectedPCs(prev => ({ ...prev, [labName]: [] }));
        } else {
            setSelectedPCs(prev => ({ ...prev, [labName]: allPCsInLab }));
        }
    };

    const handleSelectAllCities = () => {
        if (selectedCities.length === cities.length) {
            setSelectedCities([]);
        } else {
            const allCityNames = cities.map(c => c.city);
            setSelectedCities(allCityNames);
            allCityNames.forEach(city => {
                if (!labsByCity[city]) fetchLabsAndTehsilsForCity(city);
            });
        }
    };

    const handleSelectAllLabsForCity = (cityName: string) => {
        const allLabsInCity = (labsByCity[cityName] || []).map(l => l.lab_name);
        const currentSelected = selectedLabs[cityName] || [];

        if (currentSelected.length === allLabsInCity.length) {
            setSelectedLabs(prev => ({ ...prev, [cityName]: [] }));
        } else {
            setSelectedLabs(prev => ({ ...prev, [cityName]: allLabsInCity }));
        }
    };

    const handleSelectAllTehsilsGlobal = () => {
        const totalTehsils = selectedCities.reduce((acc, city) => acc + (tehsilsByCity[city]?.length || 0), 0);
        const selectedTehsilsCount = Object.values(selectedTehsils).reduce((acc, arr) => acc + arr.length, 0);

        if (selectedTehsilsCount >= totalTehsils && totalTehsils > 0) {
            const newSelectedTehsils = { ...selectedTehsils };
            selectedCities.forEach(city => { newSelectedTehsils[city] = []; });
            setSelectedTehsils(newSelectedTehsils);
            setSelectedLabs({});
            setSelectedPCs({});
        } else {
            const newSelectedTehsils = { ...selectedTehsils };
            selectedCities.forEach(city => {
                newSelectedTehsils[city] = tehsilsByCity[city] || [];
            });
            setSelectedTehsils(newSelectedTehsils);
        }
    };

    const handleSelectAllLabsGlobal = () => {
        let totalLabs = 0;
        selectedCities.forEach(city => {
            const tehsils = selectedTehsils[city] || [];
            tehsils.forEach(t => {
                totalLabs += (labsByCity[city] || []).filter((l: any) => (l.tehsil || "Unknown") === t).length;
            });
        });
        const selectedLabsCount = Object.values(selectedLabs).reduce((acc, arr) => acc + arr.length, 0);

        if (selectedLabsCount >= totalLabs && totalLabs > 0) {
            setSelectedLabs({});
            setSelectedPCs({});
        } else {
            const newSelectedLabs = { ...selectedLabs };
            selectedCities.forEach(city => {
                const tehsils = selectedTehsils[city] || [];
                tehsils.forEach(t => {
                    const labsInTehsil = (labsByCity[city] || []).filter((l: any) => (l.tehsil || "Unknown") === t).map((l: any) => l.lab_name);
                    newSelectedLabs[`${city}-${t}`] = labsInTehsil;
                    labsInTehsil.forEach((lab: string) => {
                        if (!pcsByLab[lab] && !fetchingPCs.includes(lab)) {
                            fetchPCsForLab(city, lab);
                        }
                    });
                });
            });
            setSelectedLabs(newSelectedLabs);
        }
    };

    const handleSelectAllPCsGlobal = () => {
        const allSelectedLabs = Object.values(selectedLabs).flat();
        let totalPCs = 0;
        allSelectedLabs.forEach(lab => {
            totalPCs += (pcsByLab[lab] || []).length;
        });
        const selectedPCsCount = Object.values(selectedPCs).reduce((acc, arr) => acc + arr.length, 0);

        if (selectedPCsCount >= totalPCs && totalPCs > 0) {
            setSelectedPCs({});
        } else {
            const newSelectedPCs = { ...selectedPCs };
            allSelectedLabs.forEach(lab => {
                newSelectedPCs[lab] = (pcsByLab[lab] || []).map((p: any) => p.system_id);
            });
            setSelectedPCs(newSelectedPCs);
        }
    };

    const fetchQsPCs = async (district: string, lab: string) => {
        setFetchingQsPCs(true);
        try {
            const response = await apiFetch(`/devices?city=${district}&lab=${lab}`);
            setQsPCsList(response.devices || []);
        } catch (error) {
            toast.error("Failed to fetch PCs for quick selection");
        } finally {
            setFetchingQsPCs(false);
        }
    };

    const handleGenerateSinglePC = async () => {
        if (!qsPC) return;
        const pcData = qsPCsList.find(p => p.system_id === qsPC);
        if (!pcData) return;

        const toastId = toast.loading(`Generating audit for ${pcData.pc_name || qsPC}...`);
        try {
            const { generateDynamicReport } = await import('@/lib/pdf-generator');
            await generateDynamicReport('PC', pcData);
            toast.success("PowerPoint Report Generated", { id: toastId });
        } catch (e) {
            toast.error("Failed to generate report", { id: toastId });
        }
    };

    const handleGenerateSinglePCExcel = async () => {
        if (!qsPC) return;
        const pcData = qsPCsList.find(p => p.system_id === qsPC);
        if (!pcData) return;

        const toastId = toast.loading(`Generating excel for ${pcData.pc_name || qsPC}...`);
        try {
            const { generateDynamicExcelReport } = await import('@/lib/pdf-generator');
            await generateDynamicExcelReport('PC', pcData);
            toast.success("Excel Report Generated", { id: toastId });
        } catch (e) {
            toast.error("Failed to generate report", { id: toastId });
        }
    };

    const handleGenerate = async () => {
        if (selectedCities.length === 0) {
            toast.error("Please select at least one district");
            return;
        }

        const reportData = selectedCities.flatMap(city => {
            const tehsils = selectedTehsils[city] || [];
            return tehsils.flatMap(tehsil => {
                const labs = selectedLabs[`${city}-${tehsil}`] || [];
                // Only include labs that have PCs selected
                const filteredLabs = labs.filter(labName => selectedPCs[labName] && selectedPCs[labName].length > 0);

                return filteredLabs.length > 0 ? [{
                    city: city,
                    labs: filteredLabs,
                    pcs: selectedPCs
                }] : [];
            });
        });

        if (reportData.length === 0) {
            toast.error("No data selected for report");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Generating customized PowerPoint report...");
        try {
            await generateCustomMultiLabReport(reportData);
            toast.success("PowerPoint Report Generated Successfully", { id: toastId });
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate PowerPoint report", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateExcel = async () => {
        if (selectedCities.length === 0) {
            toast.error("Please select at least one district");
            return;
        }

        const reportData = selectedCities.flatMap(city => {
            const tehsils = selectedTehsils[city] || [];
            return tehsils.flatMap(tehsil => {
                const labs = selectedLabs[`${city}-${tehsil}`] || [];
                // Only include labs that have PCs selected
                const filteredLabs = labs.filter(labName => selectedPCs[labName] && selectedPCs[labName].length > 0);

                return filteredLabs.length > 0 ? [{
                    city: city,
                    labs: filteredLabs,
                    pcs: selectedPCs
                }] : [];
            });
        });

        if (reportData.length === 0) {
            toast.error("No data selected for report");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Generating customized Excel report...");
        try {
            await generateCustomMultiLabExcelReport(reportData);
            toast.success("Excel Report Generated Successfully", { id: toastId });
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate Excel report", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-xs font-black text-white bg-secondary hover:bg-secondary/90 transition-all duration-300 shadow-xl group border border-secondary/20">
                    <FileText className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>GENERATE REPORTS</span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[95vw] lg:max-w-[1400px] bg-card border-border text-white p-0 overflow-hidden flex flex-col h-[98vh]">
                <DialogHeader className="p-0 bg-muted/30 border-b border-border shrink-0">
                    <div className="p-6 border-b border-white/5">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            Bulk Generate Reports
                        </DialogTitle>
                    </div>

                    {/* Quick Selection Dropdowns - Moved up here */}
                    <div className="px-6 py-4 bg-primary/5 space-y-3">
                        <div className="flex items-center gap-2">
                            <Monitor className="w-3 h-3 text-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Precise System Select</span>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            <Select value={qsDistrict} onValueChange={(val) => { setQsDistrict(val); setQsTehsil(""); setQsLab(""); setQsPC(""); }}>
                                <SelectTrigger className="bg-background/50 border-white/10 text-[10px] h-9 font-bold hover:border-primary/50 transition-colors">
                                    <SelectValue placeholder="DISTRICT" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-white">
                                    {Object.keys(PUNJAB_HIERARCHY).sort().map(d => (
                                        <SelectItem key={d} value={d} className="text-[10px] font-bold uppercase">{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={qsTehsil} onValueChange={(val) => { setQsTehsil(val); setQsLab(""); setQsPC(""); }} disabled={!qsDistrict}>
                                <SelectTrigger className="bg-background/50 border-white/10 text-[10px] h-9 font-bold hover:border-primary/50 transition-colors">
                                    <SelectValue placeholder="TEHSIL" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-white">
                                    {qsDistrict && PUNJAB_HIERARCHY[qsDistrict] && Object.keys(PUNJAB_HIERARCHY[qsDistrict]).sort().map(t => (
                                        <SelectItem key={t} value={t} className="text-[10px] font-bold uppercase">{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={qsLab} onValueChange={(val) => { setQsLab(val); setQsPC(""); fetchQsPCs(qsDistrict, val); }} disabled={!qsTehsil}>
                                <SelectTrigger className="bg-background/50 border-white/10 text-[10px] h-9 font-bold hover:border-primary/50 transition-colors">
                                    <SelectValue placeholder="LABORATORY" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-white">
                                    {qsDistrict && qsTehsil && PUNJAB_HIERARCHY[qsDistrict][qsTehsil] && PUNJAB_HIERARCHY[qsDistrict][qsTehsil].sort().map(l => (
                                        <SelectItem key={l} value={l} className="text-[10px] font-bold uppercase">{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={qsPC} onValueChange={setQsPC} disabled={!qsLab || fetchingQsPCs}>
                                <SelectTrigger className="bg-background/50 border-white/10 text-[10px] h-9 font-bold hover:border-primary/50 transition-colors">
                                    <SelectValue placeholder={fetchingQsPCs ? "SYNCING..." : "SELECT PC"} />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-white">
                                    {qsPCsList.map(p => (
                                        <SelectItem key={p.system_id} value={p.system_id} className="text-[10px] font-bold uppercase">{p.pc_name || p.system_id}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                className="h-9 text-[9px] font-black uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90 text-black shadow-lg transition-all"
                                disabled={!qsPC}
                                onClick={handleGenerateSinglePC}
                            >
                                <FileText size={12} /> PPTX AUDIT
                            </Button>
                            <Button
                                className="h-9 text-[9px] font-black uppercase tracking-widest gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all"
                                disabled={!qsPC}
                                onClick={handleGenerateSinglePCExcel}
                            >
                                <FileText size={12} /> EXCEL AUDIT
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body Container - Made non-scrolling to let columns stretch */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex flex-1 min-h-0 bg-background/20 backdrop-blur-md">
                        {/* Districts Column */}
                        <div className="w-1/4 border-r border-border/50 flex flex-col">
                            <div className="p-4 bg-primary/5 border-b border-border/50 flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-primary flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5" /> District
                                </span>
                                <Button variant="ghost" size="sm" className="text-[9px] h-6 px-2 font-black hover:bg-primary/20 hover:text-primary transition-all rounded-md" onClick={handleSelectAllCities}>
                                    {selectedCities.length === cities.length ? "DESELECT" : "SELECT ALL"}
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-scroll custom-scrollbar p-3 space-y-1">
                                {cities.map((city) => (
                                    <div
                                        key={city.city}
                                        className={cn(
                                            "flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 group border",
                                            selectedCities.includes(city.city)
                                                ? "bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(249,154,29,0.1)]"
                                                : "hover:bg-white/5 border-transparent"
                                        )}
                                        onClick={() => toggleCity(city.city)}
                                    >
                                        <Checkbox checked={selectedCities.includes(city.city)} className="border-primary data-[state=checked]:bg-primary" />
                                        <div className="flex-1">
                                            <p className={cn("text-xs font-bold tracking-wide transition-colors", selectedCities.includes(city.city) ? "text-primary" : "text-white/80 group-hover:text-white")}>{city.city}</p>
                                        </div>
                                        {selectedCities.includes(city.city) && <ChevronRight className="w-4 h-4 text-primary animate-in slide-in-from-left-2 duration-300" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tehsils Column */}
                        <div className="w-1/4 border-r border-border/50 flex flex-col bg-white/[0.02]">
                            <div className="p-4 bg-primary/5 border-b border-border/50 flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-primary flex items-center gap-2">
                                    <Landmark className="w-3.5 h-3.5" /> Tehsil
                                </span>
                                <Button variant="ghost" size="sm" className="text-[9px] h-6 px-2 font-black hover:bg-primary/20 hover:text-primary transition-all rounded-md" onClick={handleSelectAllTehsilsGlobal}>
                                    {(() => {
                                        const total = selectedCities.reduce((acc, city) => acc + (tehsilsByCity[city]?.length || 0), 0);
                                        const selected = Object.values(selectedTehsils).reduce((acc, arr) => acc + arr.length, 0);
                                        return (selected >= total && total > 0) ? "DESELECT" : "SELECT ALL";
                                    })()}
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-scroll custom-scrollbar p-3">
                                {selectedCities.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 p-8 text-center"><Globe className="w-10 h-10 mb-3 text-primary" /><p className="text-[9px] font-black uppercase tracking-widest">Select District First</p></div>
                                ) : (
                                    <div className="space-y-5">
                                        {selectedCities.map(city => (
                                            <div key={city} className="space-y-2.5">
                                                <div className="flex items-center gap-2 px-1"><div className="h-[1px] flex-1 bg-primary/20" /><h4 className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{city}</h4><div className="h-[1px] flex-1 bg-primary/20" /></div>
                                                <div className="space-y-1.5">
                                                    {fetchingLabs.includes(city) ? (<div className="flex items-center gap-2 p-3 opacity-50 bg-white/5 rounded-lg"><Loader2 className="w-3 h-3 animate-spin text-primary" /><span className="text-[10px] font-bold">Syncing...</span></div>) : (
                                                        tehsilsByCity[city]?.map(tehsil => (
                                                            <div key={tehsil} className={cn("flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-all border", selectedTehsils[city]?.includes(tehsil) ? "bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(249,154,29,0.05)]" : "hover:bg-white/5 border-transparent")} onClick={() => toggleTehsil(city, tehsil)}>
                                                                <Checkbox checked={selectedTehsils[city]?.includes(tehsil)} className="border-primary data-[state=checked]:bg-primary" />
                                                                <p className={cn("text-[11px] font-bold uppercase transition-colors", selectedTehsils[city]?.includes(tehsil) ? "text-primary" : "text-white/70")}>{tehsil}</p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Labs Column */}
                        <div className="w-1/4 border-r border-border/50 flex flex-col bg-white/[0.04]">
                            <div className="p-4 bg-primary/5 border-b border-border/50 flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-primary flex items-center gap-2">
                                    <Beaker className="w-3.5 h-3.5" /> Laboratory
                                </span>
                                <Button variant="ghost" size="sm" className="text-[9px] h-6 px-2 font-black hover:bg-primary/20 hover:text-primary transition-all rounded-md" onClick={handleSelectAllLabsGlobal}>
                                    {(() => {
                                        let total = 0;
                                        selectedCities.forEach(city => {
                                            (selectedTehsils[city] || []).forEach(t => {
                                                total += (labsByCity[city] || []).filter((l: any) => (l.tehsil || "Unknown") === t).length;
                                            });
                                        });
                                        const selected = Object.values(selectedLabs).reduce((acc, arr) => acc + arr.length, 0);
                                        return (selected >= total && total > 0) ? "DESELECT" : "SELECT ALL";
                                    })()}
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-scroll custom-scrollbar p-3">
                                {Object.values(selectedTehsils).flat().length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 p-8 text-center"><Landmark className="w-10 h-10 mb-3 text-secondary" /><p className="text-[9px] font-black uppercase tracking-widest">Select Tehsil First</p></div>
                                ) : (
                                    <div className="space-y-5">
                                        {Object.entries(selectedTehsils).map(([city, tehsils]) => (
                                            tehsils.map(tehsil => (
                                                <div key={`${city}-${tehsil}`} className="space-y-2.5">
                                                    <div className="flex items-center gap-2 px-1"><div className="h-[1px] flex-1 bg-primary/20" /><h4 className="text-[8px] font-black text-primary/60 uppercase tracking-[0.2em]">{tehsil}</h4><div className="h-[1px] flex-1 bg-primary/20" /></div>
                                                    <div className="space-y-2">
                                                        {(labsByCity[city] || []).filter((l: any) => (l.tehsil || "Unknown") === tehsil).map(lab => (
                                                            <div key={lab.lab_name} className={cn("flex flex-col p-3 rounded-xl cursor-pointer transition-all border space-y-2", selectedLabs[`${city}-${tehsil}`]?.includes(lab.lab_name) ? "bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(249,154,29,0.05)]" : "hover:bg-white/5 border-transparent")} onClick={() => toggleLab(city, tehsil, lab.lab_name)}>
                                                                <div className="flex items-center gap-3">
                                                                    <Checkbox checked={selectedLabs[`${city}-${tehsil}`]?.includes(lab.lab_name)} className="border-primary data-[state=checked]:bg-primary" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={cn("text-[10px] font-black uppercase leading-tight transition-colors", selectedLabs[`${city}-${tehsil}`]?.includes(lab.lab_name) ? "text-primary" : "text-white/80")}>{lab.lab_name}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between pl-8">
                                                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-bold border border-white/5 capitalize tracking-wider">{lab.total_pcs} Systems</span>
                                                                    {selectedLabs[`${city}-${tehsil}`]?.includes(lab.lab_name) && <Activity className="w-3 h-3 text-primary animate-pulse" />}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Systems Column */}
                        <div className="w-1/4 flex flex-col bg-white/[0.02]">
                            <div className="p-4 bg-primary/5 border-b border-border/50 flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-primary flex items-center gap-2">
                                    <Monitor className="w-3.5 h-3.5" /> Node Selection
                                </span>
                                <Button variant="ghost" size="sm" className="text-[9px] h-6 px-2 font-black hover:bg-primary/20 hover:text-primary transition-all rounded-md" onClick={handleSelectAllPCsGlobal}>
                                    {(() => {
                                        let total = 0;
                                        Object.values(selectedLabs).flat().forEach(lab => {
                                            total += (pcsByLab[lab] || []).length;
                                        });
                                        const selected = Object.values(selectedPCs).reduce((acc, arr) => acc + arr.length, 0);
                                        return (selected >= total && total > 0) ? "DESELECT" : "SELECT ALL";
                                    })()}
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-scroll custom-scrollbar p-3">
                                {Object.values(selectedLabs).flat().length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 p-8 text-center"><Beaker className="w-10 h-10 mb-3 text-primary" /><p className="text-[9px] font-black uppercase tracking-widest">Select Lab First</p></div>
                                ) : (
                                    <div className="space-y-5">
                                        {Object.entries(selectedLabs).map(([key, labs]) => {
                                            // Defensive check: only show if the city/tehsil is actually selected
                                            const [city, tehsil] = key.split('-');
                                            if (!selectedCities.includes(city) || !selectedTehsils[city]?.includes(tehsil)) return null;

                                            return labs.map(labName => (
                                                <div key={labName} className="space-y-2.5">
                                                    <div className="flex items-center justify-between px-1"><h4 className="text-[9px] font-black text-white/50 uppercase truncate max-w-[120px]">{labName}</h4><Button variant="ghost" size="sm" className="h-5 px-1.5 text-[8px] font-black hover:text-primary" onClick={() => handleSelectAllPCsForLab(labName)}>{(selectedPCs[labName]?.length || 0) === (pcsByLab[labName]?.length || 0) ? "NONE" : "ALL"}</Button></div>
                                                    <div className="space-y-1.5">
                                                        {fetchingPCs.includes(labName) ? (<div className="flex items-center gap-2 p-3 opacity-50"><Loader2 className="w-3 h-3 animate-spin text-primary" /><span className="text-[10px] font-bold tracking-widest">SYNCING...</span></div>) : (
                                                            pcsByLab[labName]?.map(pc => (
                                                                <div key={pc.system_id} className={cn("flex items-center space-x-3 p-2.5 rounded-xl transition-all border cursor-pointer", selectedPCs[labName]?.includes(pc.system_id) ? "bg-white/10 border-white/20" : "hover:bg-white/5 border-transparent")} onClick={() => togglePC(labName, pc.system_id)}>
                                                                    <Checkbox checked={selectedPCs[labName]?.includes(pc.system_id)} className="border-primary" />
                                                                    <div className="min-w-0"><p className={cn("text-[10px] font-bold uppercase truncate tracking-wide", selectedPCs[labName]?.includes(pc.system_id) ? "text-primary" : "text-white/80")}>{pc.pc_name || "Station"}</p><p className="text-[7px] font-mono text-white/30 tracking-tighter">{pc.system_id}</p></div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            ));
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/40 border-t border-border flex items-center justify-between sm:justify-between shrink-0">
                    <div className="flex gap-6 items-center">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mb-1">Queue Status</span>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <Globe className="w-3 h-3 text-primary opacity-50" />
                                    <span className="text-sm font-black tracking-tight">{selectedCities.length} <span className="text-[9px] font-bold opacity-40">Dists</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Beaker className="w-3 h-3 text-primary opacity-50" />
                                    <span className="text-sm font-black tracking-tight">{Object.values(selectedLabs).flat().length} <span className="text-[9px] font-bold opacity-40">Labs</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Monitor className="w-3 h-3 text-primary opacity-50" />
                                    <span className="text-sm font-black tracking-tight text-primary">{Object.values(selectedPCs).flat().length} <span className="text-[9px] font-bold opacity-40">Nodes</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            onClick={handleGenerate}
                            disabled={loading || selectedCities.length === 0}
                            className="bg-secondary hover:bg-secondary/90 text-black font-black text-[10px] uppercase tracking-widest px-8 h-11 rounded-xl shadow-xl transition-all active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <FileText className="mr-2 h-4 w-4" />
                                    PPTX
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={handleGenerateExcel}
                            disabled={loading || selectedCities.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest px-8 h-11 rounded-xl shadow-xl transition-all active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <FileText className="mr-2 h-4 w-4" />
                                    EXCEL
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
