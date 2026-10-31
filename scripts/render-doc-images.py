import sys
from playwright.sync_api import sync_playwright
OUT='public/images/case-001/'
BASE='''<html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;width:2000px;height:1100px;overflow:hidden;position:relative;
background:linear-gradient(90deg,#8a5a2e,#a06b38 20%,#8f5f31 45%,#a8733d 70%,#8a5a2e);font-family:'Liberation Mono',monospace}
.wood{position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(60,30,10,.18) 0 2px,transparent 2px 140px),repeating-linear-gradient(0deg,rgba(255,220,170,.05) 0 1px,transparent 1px 9px);}
.grain{position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;opacity:.55}
.vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,rgba(255,235,190,.18),rgba(0,0,0,0) 45%,rgba(20,8,0,.7) 100%)}
.flash{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 48% 40%,rgba(255,240,200,.25),transparent 60%)}
.paper{position:absolute;box-shadow:0 18px 40px rgba(0,0,0,.55),0 2px 4px rgba(0,0,0,.5)}
.stamp{position:absolute;border:5px double #5a3a8a;color:#5a3a8a;border-radius:14px;padding:6px 16px;font-weight:bold;text-align:center;opacity:.62;transform:rotate(-8deg);letter-spacing:2px}
.ink{font-family:'Liberation Serif',serif;font-style:italic;color:#1d3a8a}
</style></head><body><div class="wood"></div>
<svg class="grain" width="2000" height="1100"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .22  0 0 0 0 .15  0 0 0 .55 0"/></filter><rect width="2000" height="1100" filter="url(#n)"/></svg>
@@BODY@@<div class="flash"></div><div class="vig"></div></body></html>'''
PAPERTEX='''<svg width="0" height="0"><filter id="pt"><feTurbulence type="fractalNoise" baseFrequency=".02 .03" numOctaves="4" seed="9"/><feColorMatrix values="0 0 0 0 .55 0 0 0 0 .4 0 0 0 0 .2 0 0 0 .35 0"/></filter></svg>'''

d04_rows=[('20:30','—','Обход 2-го этажа. Без происшествий.',0),
('22:15','12','К. Вэнс вернулась в гостиницу, с ней мужчина. Поднялись на этаж.',0),
('22:25','—','Отмечен звук закрывающейся входной двери. Вероятно, ушёл спутник К. Вэнс.',0),
('22:40','10','Т. Вэйл (гость) вошёл в здание. Поднялся на этаж.',0),
('23:00','10','Т. Вэйл вышел, ключ оставил на доске.',0),
('00:31','12','Сделан короткий звонок с ресепшена в №12. Ответа не последовало.',0),
('01:20','—','Обход 2-го этажа. Безопасно и тихо, всё чисто.',1)]
rows=''.join(f'''<tr><td style="width:120px">{t}</td><td style="width:90px;text-align:center">{r}</td><td class="{'ink2' if o else 'ink'}" style="{'color:#0d2d7a;transform:rotate(-.6deg);font-size:27px' if o else ''}">{e}</td></tr>''' for t,r,e,o in d04_rows)
d04=f'''<div class="paper" style="left:330px;top:40px;width:1340px;height:1030px;transform:rotate(-1.2deg);background:#e9dcb4;border-radius:4px;overflow:hidden">
<svg style="position:absolute;inset:0" width="1340" height="1030"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency=".012 .02" numOctaves="4" seed="3"/><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .35 0 0 0 0 .15 0 0 0 .5 0"/></filter><rect width="1340" height="1030" filter="url(#p)"/>
<ellipse cx="1150" cy="880" rx="95" ry="80" fill="none" stroke="#7a4a1a" stroke-width="10" opacity=".25"/><ellipse cx="1150" cy="880" rx="70" ry="58" fill="none" stroke="#7a4a1a" stroke-width="3" opacity=".2"/></svg>
<div style="position:absolute;left:0;top:0;bottom:0;width:90px;background:linear-gradient(90deg,rgba(60,30,0,.45),rgba(60,30,0,0))"></div>
<div style="position:absolute;left:130px;right:70px;top:50px;font-family:'Liberation Serif',serif">
<div style="font-size:30px;letter-spacing:6px;text-align:center;color:#2b2113;font-weight:bold">PINECREST HOTEL</div>
<div style="font-size:40px;text-align:center;color:#2b2113;font-weight:bold;margin-top:6px">ЖУРНАЛ РЕГИСТРАЦИИ</div>
<div style="font-family:'Liberation Mono';font-size:25px;color:#2b2113;margin-top:26px;display:flex;justify-content:space-between"><span>Дата: 11 октября 1999</span><span>Дежурный: <span class="ink" style="font-size:34px">Э. Рид</span></span><span>Смена 20:00–08:00</span></div>
<table style="width:100%;border-collapse:collapse;margin-top:24px;font-family:'Liberation Mono';font-size:28px;color:#2a2418">
<tr style="border-top:3px solid #3a2f1c;border-bottom:3px solid #3a2f1c;font-size:22px;letter-spacing:3px"><th style="padding:10px;text-align:left">ВРЕМЯ</th><th>№</th><th style="text-align:left;padding-left:12px">ЗАПИСЬ</th></tr>
{''.join(f'<tr style="border-bottom:1.5px solid rgba(60,45,20,.45);height:92px;vertical-align:middle">'+r[4:] for r in rows.split('<tr>')[1:])}
</table>
<div style="font-family:'Liberation Mono';font-size:25px;color:#2a2418;margin-top:30px;border-top:3px solid #3a2f1c;padding-top:16px">Примечание: после 23:00 входов и выходов не зафиксировано.</div>
</div>
<div class="stamp" style="right:90px;top:70px;font-size:26px">PINECREST<br>HOTEL</div></div>
<svg style="position:absolute;left:1500px;top:900px;transform:rotate(25deg)" width="300" height="70"><rect x="0" y="22" width="300" height="26" rx="12" fill="#1a1a1e"/><rect x="250" y="22" width="50" height="26" rx="12" fill="#b9a46a"/></svg>'''
# d04 rows hack above is fragile -> rebuild simply
def tr(t,r,e,o):
    st='color:#0d2d7a;font-size:27px;transform:rotate(-.6deg);display:inline-block' if o else ''
    return f'<tr style="border-bottom:1.5px solid rgba(60,45,20,.45);height:92px"><td style="padding:0 10px;width:130px">{t}</td><td style="width:90px;text-align:center">{r}</td><td style="padding-left:12px"><span style="{st}">{e}</span></td></tr>'
body=''.join(tr(*x) for x in d04_rows)
import re
d04=re.sub(r"\{''\.join.*?\}",'',d04) if False else d04
# simpler: rebuild d04 table contents
start=d04.index('</tr>\n')+6; 
end=d04.index('</table>')
d04=d04[:start]+body+d04[end:]

def dot(lines):
    return ''.join(f'<div>{l}</div>' for l in lines)
d05_lines=['ВЫПИСКА ИЗ ЖУРНАЛА ТЕЛЕФОННЫХ СОЕДИНЕНИЙ','АТС PINECREST // 11 ОКТЯБРЯ 1999','='*52,
'ВРЕМЯ  НАПР.        АБОНЕНТЫ                     ДЛИТ.','-'*52,
'22:18  ВХОД.   внешняя линия -> НОМЕР 12         0:30',
'23:00  ИСХ.    НОМЕР 10 (Т. ВЭЙЛ) -> БАР THE LANTERN  0:15',
'00:31  ИСХ.    РЕСЕПШЕН -> НОМЕР 12   5 сек, БЕЗ ОТВЕТА','-'*52,
'ДРУГИХ СОЕДИНЕНИЙ ЧЕРЕЗ КОММУТАТОР ЗА НОЧЬ НЕ ЗАФИКСИРОВАНО.','='*52,'КОНЕЦ ВЫПИСКИ  *** PAGE 1/1 ***']
holes=''.join(f'<div style="width:22px;height:22px;border-radius:50%;background:#7a4d26;box-shadow:inset 0 3px 5px rgba(0,0,0,.6);margin:34px 0"></div>' for _ in range(12))
d05f=f'''<div class="paper" style="left:250px;top:80px;width:1500px;height:940px;transform:rotate(1.3deg);background:repeating-linear-gradient(0deg,#e7ecdc 0 70px,#d3e4c6 70px 140px)">
<svg style="position:absolute;inset:0" width="1500" height="940"><filter id="q"><feTurbulence type="fractalNoise" baseFrequency=".02 .04" numOctaves="3" seed="12"/><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .45 0 0 0 0 .25 0 0 0 .4 0"/></filter><rect width="1500" height="940" filter="url(#q)"/></svg>
<div style="position:absolute;left:0;top:0;bottom:0;width:90px;background:#e8e2cf;border-right:3px dashed rgba(0,0,0,.25);display:flex;flex-direction:column;align-items:center;justify-content:center">{holes}</div>
<div style="position:absolute;right:0;top:0;bottom:0;width:90px;background:#e8e2cf;border-left:3px dashed rgba(0,0,0,.25);display:flex;flex-direction:column;align-items:center;justify-content:center">{holes}</div>
<div style="position:absolute;left:140px;right:140px;top:70px;font-size:31px;line-height:1.75;color:#2a2f2a;white-space:pre;letter-spacing:.5px;font-family:'DejaVu Sans Mono',monospace;opacity:.9">{dot(d05_lines)}</div>
<div style="position:absolute;left:130px;right:130px;top:437px;height:46px;background:rgba(250,230,60,.45);mix-blend-mode:multiply"></div>
<div style="position:absolute;left:130px;right:130px;top:545px;height:46px;background:rgba(250,230,60,.45);mix-blend-mode:multiply"></div>
<svg style="position:absolute;left:1180px;top:520px" width="150" height="90"><path d="M10 55 L45 80 L130 10" fill="none" stroke="#1d3a8a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/></svg>
<div class="stamp" style="right:170px;top:660px;font-size:34px;transform:rotate(-10deg)">КОПИЯ<br><span style="font-size:20px">ОВР / БЕЛМОНТ</span></div></div>'''

# floor plan
def rooms():
    s=''
    top=[12,10,8,6,4,2]; bot=[11,9,7,5,3,1]
    x0=330; w=170
    for i,n in enumerate(top):
        x=x0+i*w
        s+=f'<rect x="{x}" y="200" width="{w}" height="260" fill="none" stroke="#2c2416" stroke-width="5"/>'
        s+=f'<text x="{x+w/2}" y="340" text-anchor="middle" font-size="64" font-family="Liberation Serif" font-weight="bold" fill="#2c2416">{n}</text>'
        s+=f'<path d="M{x+30} 460 A60 60 0 0 1 {x+90} 400" fill="none" stroke="#2c2416" stroke-width="3"/><rect x="{x+28}" y="454" width="64" height="10" fill="#e9dcb4"/>'
    for i,n in enumerate(bot):
        x=x0+i*w
        s+=f'<rect x="{x}" y="560" width="{w}" height="260" fill="none" stroke="#2c2416" stroke-width="5"/>'
        s+=f'<text x="{x+w/2}" y="705" text-anchor="middle" font-size="64" font-family="Liberation Serif" font-weight="bold" fill="#2c2416">{n}</text>'
        s+=f'<path d="M{x+30} 560 A60 60 0 0 0 {x+90} 620" fill="none" stroke="#2c2416" stroke-width="3"/><rect x="{x+28}" y="555" width="64" height="10" fill="#e9dcb4"/>'
    return s
plan=f'''<div class="paper" style="left:120px;top:60px;width:1760px;height:980px;transform:rotate(-.8deg);background:#e6d7a8;overflow:hidden">
<svg style="position:absolute;inset:0" width="1760" height="980"><filter id="r"><feTurbulence type="fractalNoise" baseFrequency=".015 .02" numOctaves="4" seed="21"/><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .35 0 0 0 0 .15 0 0 0 .5 0"/></filter><rect width="1760" height="980" filter="url(#r)"/>
<g transform="translate(-120,-60)" >{rooms()}
<rect x="330" y="460" width="1020" height="100" fill="rgba(120,90,40,.12)" stroke="#2c2416" stroke-width="3"/>
<text x="840" y="525" text-anchor="middle" font-size="36" font-family="Liberation Serif" font-style="italic" fill="#4a3d26">КОРИДОР</text>
<rect x="190" y="200" width="140" height="620" fill="none" stroke="#2c2416" stroke-width="5"/>
<g stroke="#2c2416" stroke-width="3">{''.join(f'<line x1="195" y1="{210+i*34}" x2="325" y2="{210+i*34}"/>' for i in range(17))}</g>
<text x="260" y="520" text-anchor="middle" font-size="34" font-family="Liberation Serif" font-weight="bold" fill="#2c2416" transform="rotate(-90 260 520)" style="paint-order:stroke;stroke:#e6d7a8;stroke-width:12px">ЛЕСТНИЦА</text>
<rect x="1350" y="470" width="30" height="80" fill="#9fc0c4" opacity=".7" stroke="#2c2416" stroke-width="4"/>
<text x="1430" y="505" font-size="30" font-family="Liberation Serif" font-style="italic" fill="#4a3d26">стеклянная</text><text x="1430" y="540" font-size="30" font-family="Liberation Serif" font-style="italic" fill="#4a3d26">дверь</text>
<text x="1190" y="190" font-size="28" font-family="Liberation Serif" font-style="italic" fill="#4a3d26">пожарный выход →</text>
<ellipse cx="415" cy="330" rx="105" ry="150" fill="none" stroke="#a31b1b" stroke-width="7" transform="rotate(-2 415 330)" opacity=".85"/>
<text x="330" y="165" font-size="34" font-family="Liberation Serif" font-style="italic" fill="#a31b1b" transform="rotate(-3 330 165)">№12 — место происшествия</text>
<text x="500" y="190" font-size="26" font-family="Liberation Serif" font-style="italic" fill="#1d3a8a">№10 — Т. Вэйл</text>
</g></svg>
<div style="position:absolute;left:50px;top:30px;font-family:'Liberation Serif';font-size:34px;font-weight:bold;color:#2c2416;letter-spacing:3px">PINECREST HOTEL — ВТОРОЙ ЭТАЖ</div>
<div style="position:absolute;right:60px;bottom:40px;font-family:'Liberation Serif';font-size:24px;color:#4a3d26">План не в масштабе. Копия архива.</div>
<div style="position:absolute;left:0;top:0;width:100px;height:100px;background:rgba(210,190,130,.8);transform:rotate(45deg) translate(-70px,-20px)"></div>
<div style="position:absolute;right:-30px;top:-18px;width:150px;height:46px;background:rgba(235,225,180,.7);transform:rotate(40deg)"></div>
</div>'''
pages={'pinecrest_reception_logbook_ru.jpg':d04,'pinecrest_call_log_1999_ru.jpg':d05f,'pinecrest_floor_plan_90s_ru.jpg':plan}
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':2000,'height':1100})
    for fn,html in pages.items():
        pg.set_content(BASE.replace("@@BODY@@",html)); pg.wait_for_timeout(300); pg.screenshot(path=OUT+fn,type='jpeg',quality=84)
    b.close()
print('done')
