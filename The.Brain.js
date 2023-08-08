{
  "translatorID": "f045946a-4c6a-43ac-81b0-eaf52d892cbf",
  "label": "The Brain",
  "description": "exports references in a format that can be imported by The Brain",
  "creator": "Emiliano Heyns",
  "target": "txt",
  "minVersion": "4.0.27",
  "maxVersion": "",
  "configOptions": {
    "getCollections": true
  },
  "displayOptions": {
    "exportNotes": true
  },
  "translatorType": 2,
  "browserSupport": "gcsv",
  "priority": 99,
  "inRepository": false,
  "lastUpdated": "2019-03-30 20:25:23"
}

// version: 0.0.18

const aliases = Object.entries({
    bookTitle: 'publicationTitle',
    thesisType: 'type',
    university: 'publisher',
    letterType: 'type',
    manuscriptType: 'type',
    interviewMedium: 'medium',
    distributor: 'publisher',
    videoRecordingFormat: 'medium',
    genre: 'type',
    artworkMedium: 'medium',
    websiteType: 'type',
    websiteTitle: 'publicationTitle',
    institution: 'publisher',
    reportType: 'type',
    reportNumber: 'number',
    billNumber: 'number',
    codeVolume: 'volume',
    codePages: 'pages',
    dateDecided: 'date',
    reporterVolume: 'volume',
    firstPage: 'pages',
    caseName: 'title',
    docketNumber: 'number',
    documentNumber: 'number',
    patentNumber: 'number',
    issueDate: 'date',
    dateEnacted: 'date',
    publicLawNumber: 'number',
    nameOfAct: 'title',
    subject: 'title',
    mapType: 'type',
    blogTitle: 'publicationTitle',
    postType: 'type',
    forumTitle: 'publicationTitle',
    audioRecordingFormat: 'medium',
    label: 'publisher',
    presentationType: 'type',
    studio: 'publisher',
    network: 'publisher',
    episodeNumber: 'number',
    programTitle: 'publicationTitle',
    audioFileType: 'medium',
    company: 'publisher',
    proceedingsTitle: 'publicationTitle',
    encyclopediaTitle: 'publicationTitle',
    dictionaryTitle: 'publicationTitle',
});
function clean(txt) {
    return txt.replace(/\r/g, '').replace(/\n/g, ' ').replace(/;/g, ',').replace(/["“”]/g, "'");
}
function url(txt) {
    const arbitrary_tb_limit = 185;
    const ellipses = ' ...';
    if (txt[0] === '/' || txt.match(/^[a-z]:\\/i)) {
        txt = txt.replace(/\\/g, '/');
        if (txt[0] !== '/')
            txt = `/${txt}`;
        txt = encodeURI(`file://${txt}`).replace(/[?#]/g, encodeURIComponent);
    }
    if (txt.length <= arbitrary_tb_limit)
        return txt;
    return txt.substr(0, arbitrary_tb_limit - ellipses.length) + ellipses;
}
const ignore = new Set(['attachment', 'note']);
function detail(txt, prefix) {
    if (!txt)
        return;
    txt = prefix === '+' ? url(txt) : clean(txt);
    if (prefix)
        prefix += ' ';
    Zotero.write(`\t${prefix}${txt}\n`);
}
function doExport() {
    let item;
    while (item = Zotero.nextItem()) {
        if (ignore.has(item.itemType))
            continue;
        for (const [alias, field] of aliases) {
            if (item[alias]) {
                item[field] = item[alias];
                delete item[alias];
            }
        }
        const reference = [];
        const creators = (item.creators || []).map(creator => {
            let name = '';
            if (creator.name)
                name = creator.name;
            if (creator.lastName)
                name = creator.lastName;
            if (creator.firstName)
                name += (name ? ', ' : '') + creator.firstName;
            return name;
        });
        switch (creators.length) {
            case 0:
                break;
            case 1:
                reference.push(creators[0]);
                break;
            default:
                reference.push(`${creators[0]} et al`);
                break;
        }
        const date = Zotero.Utilities.strToDate(item.date);
        const year = (date && typeof date.year !== 'undefined') ? date.year : '';
        if (year)
            reference.push(year);
        let title = item.title;
        if (reference.length)
            title += `, (${reference.join(', ')})`;
        Zotero.write((year ? `.${year} ` : '') + clean(title) + '\n');
        const [, ug, libraryID, key] = item.uri.match(/http:\/\/zotero\.org\/(users(?:\/local)?|groups)\/([^\/]+)\/items\/(.+)/);
        detail(`zotero://select/items/${ug === 'users/local' ? '0' : libraryID}_${key}`, '+');
        detail(item.url, '+');
        for (const att of (item.attachments || [])) {
            detail(att.localPath || att.defaultPath || att.url, '+');
        }
        detail(item.abstractNote, '-');
        for (const note of (item.notes || [])) {
            detail(note.note.replace(/<[^>]*>?/g, ''), '-');
        }
        for (const name of creators) {
            detail(name, '#');
        }
        detail(year, '#');
        detail(item.publicationTitle, '#');
        for (const tag of (item.tags || [])) {
            if (tag.type === 1)
                continue;
            detail(tag.tag, '#');
        }
        let itemType = item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1);
        itemType = itemType.replace(/([A-Z]+)/g, ' $1').trim();
        detail(itemType, '#');
        for (const line of (item.extra || '').split(/\r?\n/).map(l => l.trim())) {
            if (line.match(/^[0-9]{5}$/)) {
                detail(`Citations: ${line.replace(/^0+/, '') || 0}`, '');
            }
        }
        detail(key, '');
        Zotero.write('\n');
    }
}
