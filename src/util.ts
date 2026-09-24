export type Variable = {
    ad: string;
    tip: string;
    etiketler: string;
    plcAdı: string;
    read: boolean;
    adres: string;
    register: number;
    bitNumber: number;
};

function fitCharsEnglish(str: string): string {
    const replacements: { [key: string]: string } = {
        İ: "I",
        ı: "i",
        ü: "u",
        Ü: "U",
        ö: "o",
        Ö: "O",
        ç: "c",
        Ç: "C",
        ğ: "g",
        Ğ: "G",
        Ş: "S",
        ş: "s",
    };
    return str.replace(/[İıüÜöÖçÇğĞŞş]/g, (char) => replacements[char] || char);
}

function parseTemplate(input: string): Variable | null {
    if (!input) return null;

    let [ad, tip, etiketler, plcAdı, readStr] = input.split(":");

    if (!ad || !tip) {
        console.warn(`Invalid template format: ${input}`);
        return null;
    }
    const read = readStr === "1";
    plcAdı = plcAdı && plcAdı.length > 0 ? plcAdı : ad;
    tip = fitCharsEnglish(tip).toLowerCase().trim();
    plcAdı = fitCharsEnglish(plcAdı);
    return {
        ad,
        tip,
        etiketler,
        plcAdı,
        read,
        adres: "",
        register: -1,
        bitNumber: -1,
    };
}

function getVars(txt: string, addr: number = 0): Variable[] {
    const lines = txt.split("\n");
    let lastWord = addr;
    let lastBit = 0;
    let lastBitWas15 = false;
    let lastWasBool = false;
    const variables: Array<Variable> = [];
    lines.forEach((line) => {
        const variable = parseTemplate(line);
        if (!variable) return;

        if (variable.tip == "bool") {
            variable.register = lastWord;
            variable.bitNumber = lastBit;
            lastBit++;
            lastWasBool = true;
            if (lastBit > 15) {
                lastBitWas15 = true;
                lastBit = 0;
                lastWord++;
            } else {
                lastBitWas15 = false;
            }
        } else {
            if (lastWasBool && !lastBitWas15) lastWord++;
            lastWasBool = false;
            lastBitWas15 = false;
            lastBit = 0;
            variable.register = lastWord;
            lastWord++;
            if (variable.tip == "real" || variable.tip == "dint") lastWord++;
        }

        variables.push(variable);
    });
    return variables;
}

function getATString(variable: Variable): string {
    let result = `%MW${variable.register}`;

    if (variable.tip == "dint") result = `%MD${variable.register}`;
    else if (variable.tip == "real") result = `%MF${variable.register}`;
    else if (variable.tip == "bool") result = `%MW${variable.register}:X${variable.bitNumber}`;
    return result;
}

export function createDefinitions(txt: string, addr: number = 0): {
    plc: string;
    property: string;
    inline: string;
    enum: string;
    init: string;
} {
    const variables = getVars(txt, addr);
    const memoryWords: Variable[] = [];
    const memoryDoubleWords: Variable[] = [];
    const memoryFloats: Variable[] = [];
    const customSymbols: Variable[] = [];
    const tipArrPairs = [
        { tip: "boolint", arr: memoryWords },
        { tip: "realint", arr: memoryWords },
        { tip: "int", arr: memoryWords },
        { tip: "dint", arr: memoryDoubleWords },
        { tip: "real", arr: memoryFloats },
        { tip: "bool", arr: customSymbols },
    ];

    const scadaDefinitions: string[] = [];
    const scadaInlineDefinitions: string[] = [];
    const scadaEnumDefinitions: string[] = [];
    const scadaInstantiations: string[] = [];
    variables.forEach((variable) => {
        if (variable.tip.includes("realint")) memoryWords.push(variable);
        else tipArrPairs.find((x) => x.tip == variable.tip)?.arr.push(variable);

        const scadaDef = `public IVariable ${variable.ad} { get; set; }`;
        const inst = `VariableHelper.Define("${variable.ad} AT${getATString(variable)} : ${variable.tip}", "${variable.etiketler}", "${variable.read ? "true" : "false"}");`;
        scadaDefinitions.push(scadaDef);
        scadaInlineDefinitions.push(`${scadaDef} = ${inst}`);
        scadaEnumDefinitions.push(variable.ad);
        scadaInstantiations.push(`${variable.ad} = ${inst}`);
    });

    const plcDefinition = `
    <MemoryWords>
        ${memoryWords.map((x, index, _arr) => `<MemoryWord><Address>%MW${x.register}</Address><Index>${index}</Index><Symbol>${x.plcAdı}</Symbol></MemoryWord>`).join("\n\t")}
    </MemoryWords>
    <MemoryDoubleWords>
        ${memoryDoubleWords.map((x, index, _arr) => `<MemoryDoubleWord><Address>%MD${x.register}</Address><Index>${index}</Index><Symbol>${x.plcAdı}</Symbol></MemoryDoubleWord>`).join("\n\t")}
    </MemoryDoubleWords>
    <MemoryFloats>
        ${memoryFloats.map((x, index, _arr) => `<MemoryFloat><Address>%MF${x.register}</Address><Index>${index}</Index><Symbol>${x.plcAdı}</Symbol></MemoryFloat>`).join("\n\t")}
    </MemoryFloats>
    <CustomSymbols>
        ${customSymbols.map((x, index, _arr) => `<CustomSymbol><Address>%MW${x.register}:X${x.bitNumber}</Address><Index>${index}</Index><Symbol>${x.plcAdı}</Symbol></CustomSymbol>`).join("\n\t")}
    </CustomSymbols>
    `;
    return {
        plc: plcDefinition,
        property: scadaDefinitions.join("\n"),
        inline: scadaInlineDefinitions.join("\n"),
        enum: scadaEnumDefinitions.join(",\n"),
        init: scadaInstantiations.join("\n"),
    };
}
