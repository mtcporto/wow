"""Import client map textures and Journal pins from Wago DB2/CASC exports.
Requires Pillow. This converts Blizzard assets; it does not draw new geometry.
"""
import argparse, csv, io, json, tempfile, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

parser=argparse.ArgumentParser()
parser.add_argument('--instance',type=int,default=746)
parser.add_argument('--build',default='')
args=parser.parse_args()
root=Path(__file__).resolve().parent.parent

def download(url):
    request=urllib.request.Request(url,headers={'User-Agent':'AzerothExplorer-map-import/1.0'})
    with urllib.request.urlopen(request,timeout=45) as response:return response.read()

def table(name):
    suffix=('?build='+args.build) if args.build else ''
    content=download('https://wago.tools/db2/'+name+'/csv'+suffix).decode('utf-8-sig')
    rows=list(csv.DictReader(io.StringIO(content)))
    if not rows or 'ID' not in rows[0]:raise ValueError('No DB2 rows for '+name)
    return rows

names=['JournalEncounter','UiMap','UiMapXMapArt','UiMapArt','UiMapArtStyleLayer','UiMapArtTile']
with ThreadPoolExecutor(max_workers=3) as pool:data=dict(zip(names,pool.map(table,names)))
encounters=[row for row in data['JournalEncounter'] if int(row['JournalInstanceID'])==args.instance and int(row['UiMapID'])>0]
if not encounters:raise ValueError('No journal map positions for this instance')
manifest_path=root/'public/data/instance-maps.json'
manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {'instances':{}}
floors=[]
previous=manifest['instances'].get(str(args.instance),{})
previous_pins={pin['encounterId']:pin for floor in previous.get('floors',[]) for pin in floor['pins']}
previous_floors={floor['uiMapId']:floor for floor in previous.get('floors',[])}
with tempfile.TemporaryDirectory(prefix='wow-map-import-',dir=root/'public/assets/maps') as temporary:
    outputs=[]
    for map_id in sorted({int(row['UiMapID']) for row in encounters}):
        ui=next(row for row in data['UiMap'] if int(row['ID'])==map_id)
        mappings=[row for row in data['UiMapXMapArt'] if int(row['UiMapID'])==map_id]
        mapping=next((row for row in mappings if int(row['PhaseID'])==0),mappings[0])
        art_id=int(mapping['UiMapArtID'])
        art=next(row for row in data['UiMapArt'] if int(row['ID'])==art_id)
        style=next(row for row in data['UiMapArtStyleLayer'] if row['UiMapArtStyleID']==art['UiMapArtStyleID'] and int(row['LayerIndex'])==0)
        width,height=int(style['LayerWidth']),int(style['LayerHeight'])
        tiles=[row for row in data['UiMapArtTile'] if int(row['UiMapArtID'])==art_id and int(row['LayerIndex'])==0]
        if not tiles:raise ValueError('No tiles for map '+str(map_id))
        image=Image.new('RGB',(width,height))
        def tile(row):
            suffix=('?version='+args.build) if args.build else ''
            raw=download('https://wago.tools/api/casc/'+row['FileDataID']+suffix)
            texture=Image.open(io.BytesIO(raw)).convert('RGB')
            return row,texture
        with ThreadPoolExecutor(max_workers=3) as pool:
            for row,texture in pool.map(tile,tiles):image.paste(texture,(int(row['ColIndex'])*int(style['TileWidth']),int(row['RowIndex'])*int(style['TileHeight'])))
        filename='uimap-'+str(map_id)+'.webp'
        stage=Path(temporary)/filename
        image.save(stage,'WEBP',lossless=True)
        outputs.append((stage,root/'public/assets/maps'/filename))
        pins=[]
        for row in encounters:
            if int(row['UiMapID'])!=map_id:continue
            x,y=float(row['Map_0']),float(row['Map_1'])
            if not (0<=x<=1 and 0<=y<=1):raise ValueError('Map coordinate outside image bounds')
            pins.append({'encounterId':int(row['ID']),'name':{**previous_pins.get(int(row['ID']),{}).get('name',{}),'en_US':row['Name_lang']},'x':x,'y':y,'order':int(row['OrderIndex'])+1})
        floors.append({'uiMapId':map_id,'name':{**previous_floors.get(map_id,{}).get('name',{}),'en_US':ui['Name_lang']},'image':'/assets/maps/'+filename,'width':width,'height':height,'pins':pins,'artId':art_id,'fileDataIds':[int(row['FileDataID']) for row in tiles]})
    manifest['instances'][str(args.instance)]={'name':{**previous.get('name',{}),'en_US':floors[0]['name']['en_US']},'floors':floors,'source':{'provider':'Wago.tools DB2/CASC','retrievedAt':datetime.now(timezone.utc).isoformat(),'requestedBuild':args.build or None,'url':'https://wago.tools/db2/JournalEncounter'}}
    for stage,destination in outputs:destination.parent.mkdir(parents=True,exist_ok=True);stage.replace(destination)
    manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Imported',len(floors),'map(s),',sum(len(floor['pins']) for floor in floors),'encounter pins')
