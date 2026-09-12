from pathlib import Path
import json, hashlib, argparse
from fontTools.ttLib import TTFont
from fontTools import subset

parser=argparse.ArgumentParser(description='Recreate the complete Rounded M+ Unicode split without changing the app.')
parser.add_argument('--source', type=Path, required=True, help='Directory containing MPLUSRounded1c-Medium.ttf and MPLUSRounded1c-Bold.ttf')
parser.add_argument('--output', type=Path, required=True, help='Separate output directory for review')
args=parser.parse_args()
repo=Path(__file__).resolve().parents[1]
target=args.output.resolve(); target.mkdir(parents=True, exist_ok=True)
text=''.join(p.read_text(encoding='utf-8') for directory in ['public','src','portable/html'] for p in (repo/directory).rglob('*') if p.is_file() and p.suffix in ['.js','.tsx','.ts','.html'])
text+=(repo/'index.html').read_text(encoding='utf-8')+(repo/'tools/font-common-ui.txt').read_text(encoding='utf-8')
common={ord(c) for c in text}|set(range(32,256))
def ranges(chars):
    runs=[]
    for n in sorted(chars):
        if runs and n==runs[-1][1]+1:runs[-1][1]=n
        else:runs.append([n,n])
    return ','.join('U+%X'%a if a==b else 'U+%X-%X'%(a,b) for a,b in runs)
css=[];records=[]
for style,weight in [('Medium',500),('Bold',700)]:
    source=args.source/f'MPLUSRounded1c-{style}.ttf'
    original=TTFont(source); cmap=original.getBestCmap();coverage=set(cmap);restored=set()
    for group,chars in [('extended',coverage-common),('common',coverage&common)]:
        font=TTFont(source)
        opts=subset.Options();opts.layout_features=['*'];opts.name_IDs=['*'];opts.name_legacy=True;opts.name_languages=['*'];opts.recalc_timestamp=False
        sub=subset.Subsetter(options=opts);sub.populate(unicodes=chars);sub.subset(font)
        # A distinct family name identifies the locally subsetted distribution.
        for name in font['name'].names:
            if name.nameID in [1,4,6,16,17]:
                value={1:'Quiz Pal Rounded',4:'Quiz Pal Rounded '+style,6:'QuizPalRounded-'+style,16:'Quiz Pal Rounded',17:style}[name.nameID]
                name.string=value.encode(name.getEncoding())
        font.flavor='woff2';file=target/f'QuizPalRounded-{style}-{group}.woff2';font.save(file)
        actual=TTFont(file);actual_cmap=actual.getBestCmap();assert chars<=set(actual_cmap)<=coverage
        restored|=set(actual_cmap)
        # Preserve glyph metrics and the complete original Unicode repertoire.
        for cp,glyph in actual_cmap.items():assert actual['hmtx'][glyph]==original['hmtx'][cmap[cp]]
        css.append('@font-face {font-family:"Quiz Pal Rounded";src:url("./assets/fonts/%s") format("woff2");font-style:normal;font-weight:%s;font-display:swap;unicode-range:%s;}\n'%(file.name,weight,ranges(chars)))
        records.append({'file':file.name,'weight':weight,'characters':len(chars),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
    assert restored==coverage
    print(style,len(coverage),'characters retained',flush=True)
original_css=(repo/'public/fonts.css').read_text(encoding='utf-8').split('/* Quiz Pal Rounded fonts */')[0]
(target/'fonts.css').write_text(original_css+'\n/* Quiz Pal Rounded fonts */\n'+''.join(css),encoding='utf-8')
license_text=(repo/'public/assets/fonts/OFL.txt').read_text(encoding='utf-8');license_text=license_text[license_text.index('SIL OPEN FONT LICENSE'):]
(target/'OFL-Rounded.txt').write_text('Copyright 2016 The Rounded M+ Project Authors.\n\n'+license_text,encoding='utf-8')
(target/'font-verification.json').write_text(json.dumps({'allOriginalCodepointsRetained':True,'metricsRetained':True,'files':records},indent=2),encoding='utf-8')
