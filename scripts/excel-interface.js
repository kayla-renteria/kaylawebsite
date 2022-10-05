const defaultOpts = {
    cache: {
        expiryMillis: 60 * 1000 * 5,
        useFileName: true
    }
}

const readFile = (file, opts) => {
    return new Promise((resolve, reject) => {
        var fr = new FileReader();
        fr.onload = () => {
            resolve(fr.result)
        };
        fr.onerror = reject;
        fr.readAsArrayBuffer(file);
    });
}

const getWorkbook = (fileName, opts) => {
    if (opts.cache) {
        const cachedFile = JSON.parse(localStorage.getItem(opts.cache.useFileName ? fileName : opts.cache.cacheKey));
        if (opts.cache.expiryMillis && cachedFile) {
            const now = Date.now();
            // Expire cache every 5 minutes
            if (now - cachedFile.timestamp < opts.cache.expiryMillis) {
                return Promise.resolve(cachedFile.workbook);
            }
            localStorage.removeItem(fileName);
        }
    }
    return axios.get(fileName, {
            responseType: 'blob'
        })
        .then(res => readFile(res.data, opts))
        .then(arrayBuffer => {
            let binary = "";
            const bytes = new Uint8Array(arrayBuffer);
            const length = bytes.byteLength;
            for (let i = 0; i < length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const workbook = XLSX.read(binary, {
                type: 'binary',
                cellDates: true,
                cellStyles: true
            });
            localStorage.setItem(fileName, JSON.stringify({
                workbook: workbook,
                timestamp: Date.now()
            }));
            return workbook
        });
}

const getDataFromExcelSheet = (fileName, worksheetName, opts = {}) => {
    const mergedOpts = {
        ...defaultOpts,
        ...opts
    };
    return getWorkbook(fileName, mergedOpts)
        .then(workbook => XLSX.utils.sheet_to_json(workbook.Sheets[worksheetName]));
}

export default getDataFromExcelSheet;