'use strict';

class Node {
    constructor(fileName, level, i) {
        this.text = fileName;
        this.level = level;
        this.id = `node${level}_${i}`;
    }
    addChildNode(fileName) {
        if (this.children) {
            this.children.push(fileName);
        }
        else {
            this.children = [fileName];
        }
    }
    addHref(link) {
        this.link = link;
    }
}


let data = {};
const fileSelected = function () {
    const fileTag = document.querySelector('#zip_file');
    const selectedFileName = fileTag.files[0].name;;
    const blob = new zip.BlobReader(fileTag.files[0]);
    const z = new zip.ZipReader(blob);

    z.getEntries().then(files => {
        let rootLevel;

        for (const [i, file] of files.entries()) {
            const fileNameArray = file.filename.split('/');
            let level;

            if (file.directory) {
                level = fileNameArray.length - 2;
            }
            else {
                level = fileNameArray.length - 1;
            }

            const fileName = fileNameArray[level];
            const parent = fileNameArray[level - 1];

            data[`${fileName}_${level}`] = new Node(fileName, level, i);

            if (data[`${parent}_${level - 1}`]) {
                data[`${parent}_${level - 1}`].addChildNode(data[`${fileName}_${level}`]);
            }

            if (!rootLevel) rootLevel = level;
            else if (rootLevel && rootLevel > level) rootLevel = level;

            if (!file.directory){
                file.getData(new zip.BlobWriter()).then((blob) => {
                    const link = URL.createObjectURL(blob);
                    data[`${fileName}_${level}`].addHref(link);
                });
            }
            
        }

        //console.log(data);

        const dataTree = [];
        // console.log(`Lowest level is: ${rootLevel}`);

        for (const node of Object.values(data)) {
            if (node.level === rootLevel) {
                const tree = { ...node };
                dataTree.push(tree);
            }
        };

        // console.log(dataTree);

        document.querySelector('.file_input').style.display = 'none';
        document.querySelector('#file_name').textContent = selectedFileName;

        $('#jstree_demo_div').jstree({
            "core": {
                'data': [...dataTree]
            }
        });

        document.querySelector('.file_tree').style.display = 'inline-block';
    });
};

document.querySelector('#open_file_btn').addEventListener('click', function(){
    document.querySelector('#zip_file').click();
});
document.querySelector('#zip_file').addEventListener('change', fileSelected);

const addDownload = function (nodeTag) {
    const level = nodeTag.id.split('_')[0].replace('node', '');
    const nodeData = data[`${nodeTag.textContent}_${level}`];

    const hiddenElem = document.createElement('a');
    hiddenElem.href = nodeData.link;
    hiddenElem.download = nodeData.text;
    
    hiddenElem.click();
};

document.addEventListener('click', function(e){
    if(e.target.localName === 'a'){
        const targetClass = e.target.parentElement.className.split(' ');
        
        if(targetClass.includes('jstree-leaf')){
            addDownload(e.target);
        }
        else{
            $('#jstree_demo_div').jstree(true).toggle_node(e.target.parentElement);
        }
    }
});

const btn = document.querySelector('#download_files');

btn.addEventListener('click', function(){
    for (const node of Object.values(data)){
        if(node.link){
            const hiddenElem = document.createElement('a');
            hiddenElem.href = node.link;
            hiddenElem.download = node.text;
            
            hiddenElem.click();
        }
    }
});

document.querySelector('#extract_another_btn').addEventListener('click', function(){
    data = {};
    $('#jstree_demo_div').jstree(true).destroy();
    document.querySelector('.file_tree').style.display = 'none';
    document.querySelector('.file_input').style.display = 'block';
});


