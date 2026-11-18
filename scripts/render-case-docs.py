# Рисует D01 (рапорт), D02 (акт вскрытия), D03 (опись вещей) с текстом из documents.json.
# Запуск из корня проекта: python3 scripts/render-case-docs.py
import json, html
src = open('scripts/render-doc-images.py', encoding='utf-8').read()
exec(src[:src.index('d04_rows')])  # BASE, OUT, PAPERTEX

docs = {d['id']: d for d in json.load(open('content/cases/case-001/documents.json', encoding='utf-8'))}
esc = html.escape

def paper(inner, left=380, top=45, w=1240, h=1010, rot=-0.9, stamp=''):
    return f'''<div class="paper" style="left:{left}px;top:{top}px;width:{w}px;height:{h}px;transform:rotate({rot}deg);background:#eadfbb;border-radius:3px;overflow:hidden">
<svg style="position:absolute;inset:0" width="{w}" height="{h}"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency=".012 .02" numOctaves="4" seed="7"/><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .35 0 0 0 0 .15 0 0 0 .5 0"/></filter><rect width="{w}" height="{h}" filter="url(#p)"/>
<ellipse cx="{w-140}" cy="{h-120}" rx="90" ry="70" fill="none" stroke="#7a4a1a" stroke-width="9" opacity=".22"/></svg>
<div style="position:absolute;left:90px;right:90px;top:60px;color:#262016">{inner}</div>{stamp}</div>'''

def lines(text, size=27, gap=14):
    return ''.join(f'<p style="margin:0 0 {gap}px;font-size:{size}px;line-height:1.38">{esc(p)}</p>' for p in text.split('\n') if p.strip())

# ---------- D01 ----------
c = docs['D01']['content'].split('\n\n[СИСТЕМНОЕ')[0].split('\n')
d01 = paper(f'''
<div style="text-align:center;font-family:'Liberation Serif';font-weight:bold;letter-spacing:3px;font-size:30px">ОТДЕЛ ПОЛИЦИИ БЕЛМОНТА</div>
<div style="text-align:center;font-family:'Liberation Serif';font-weight:bold;font-size:38px;margin:8px 0 22px">ПЕРВИЧНЫЙ РАПОРТ ОСМОТРА МЕСТА ПРОИСШЕСТВИЯ</div>
<div style="display:flex;justify-content:space-between;font-size:25px;margin-bottom:22px;border-top:3px solid #3a2f1c;border-bottom:3px solid #3a2f1c;padding:10px 0"><span>ДАТА: 12 октября 1999 г.</span><span>ПРИБЫТИЕ: 08:35</span><span>Жетон #402</span></div>
{lines(chr(10).join(x for x in c[1:] if not x.startswith('Время прибытия')), 27, 15)}
<div style="margin-top:34px;display:flex;justify-content:space-between;align-items:flex-end;font-size:25px"><span>Патрульный: <span class="ink" style="font-size:44px">R. Doyle</span></span><span>Р. ДОЙЛ</span></div>
''', rot=-1.1, stamp='<div class="stamp" style="right:110px;bottom:90px;font-size:24px">ПОЛИЦИЯ<br>БЕЛМОНТ</div>')

# ---------- D02 ----------
d02 = paper(f'''
<div style="text-align:center;font-size:27px;letter-spacing:2px;border-bottom:3px solid #3a2f1c;padding-bottom:10px">ОТДЕЛ СУДЕБНО-МЕДИЦИНСКОЙ ЭКСПЕРТИЗЫ, г. БЕЛМОНТ</div>
<div style="text-align:center;font-family:'Liberation Serif';font-weight:bold;font-size:40px;margin:26px 0 18px">АКТ СУДЕБНО-МЕДИЦИНСКОГО ЭКСПЕРТА № 44-В</div>
<div style="font-size:27px;line-height:1.5;margin-bottom:12px">Дата вскрытия: 12.10.1999 г.<br>ФИО: <b>ВЭНС КЛАРА</b> &nbsp; Возраст: <b>21 год</b> &nbsp; Пол: женский</div>
<div style="font-size:27px;line-height:1.45;margin-top:18px"><b>ПРИЧИНА СМЕРТИ:</b> механическая асфиксия в результате сдавливания шеи тупым предметом (вероятно, предплечьем или мягкой тканью).</div>
<div style="font-size:27px;line-height:1.45;margin-top:18px"><b>ВРЕМЯ СМЕРТИ:</b> на основании трупного окоченения и температуры тела смерть наступила <u>приблизительно в 01:00 ночи</u>.</div>
<div style="font-size:27px;line-height:1.45;margin-top:18px"><b>ДОПОЛНИТЕЛЬНО:</b> на безымянном пальце правой руки обнаружен светлый след кожи, свидетельствующий о длительном ношении кольца. На момент осмотра тела кольцо отсутствовало.</div>
<div style="font-size:27px;line-height:1.45;margin-top:18px"><b>ПРИМЕЧАНИЕ:</b> защитных повреждений на кистях и предплечьях нет. Признаков длительной борьбы не выявлено.</div>
<div style="margin-top:56px;font-size:25px;display:flex;justify-content:space-between;align-items:flex-end"><span>СУДМЕДЭКСПЕРТ: <span class="ink" style="font-size:44px">D. Harris</span> Д. ХАРРИС</span><span>Дата: 12.10.1999</span></div>
<svg style="position:absolute;left:-40px;top:300px" width="80" height="180"><path d="M10 30 L40 62 L70 12" fill="none" stroke="#1d3a8a" stroke-width="5" opacity=".7"/><path d="M10 120 L40 152 L70 102" fill="none" stroke="#1d3a8a" stroke-width="5" opacity=".7"/></svg>
''', rot=0.8, stamp='<div class="stamp" style="right:110px;bottom:100px;font-size:26px;border-color:#2c3f8a;color:#2c3f8a">БЕЛМОНТ<br>СМЭ</div>')

# ---------- D03 ----------
items=[('1','Дорожная сумка (кожа, коричневая)','1 шт.'),('2','Сменная одежда: блузки, юбки, джинсы','4 шт.'),
('3','Кошелёк с наличностью и пропуском на фестиваль Riverside','1 шт.'),('4','Наручные часы (на тумбочке, механизм остановлен)','1 шт.'),
('5','Блокнот с записями и ручка','1 шт.')]
rows=''.join(f'<tr style="border-bottom:1.5px solid rgba(60,45,20,.45);height:78px"><td style="width:60px;text-align:center">{n}</td><td>{esc(t)}</td><td style="width:110px;text-align:right">{q}</td></tr>' for n,t,q in items)
d03 = paper(f'''
<div style="text-align:center;font-size:27px;letter-spacing:2px;border-bottom:3px solid #3a2f1c;padding-bottom:10px">ПОЛИЦИЯ БЕЛМОНТА // КАМЕРА ВЕЩЕСТВЕННЫХ ДОКАЗАТЕЛЬСТВ</div>
<div style="text-align:center;font-family:'Liberation Serif';font-weight:bold;font-size:40px;margin:24px 0 14px">ОПИСЬ ИМУЩЕСТВА (НОМЕР 12)</div>
<div style="font-size:26px;margin-bottom:18px">Владелец: Клара Вэнс, 21 год. Гостиница Pinecrest, второй этаж. К рапорту от 12.10.1999.</div>
<table style="width:100%;border-collapse:collapse;font-size:28px"><tr style="border-top:3px solid #3a2f1c;border-bottom:3px solid #3a2f1c;font-size:22px;letter-spacing:3px;height:48px"><th>№</th><th style="text-align:left">НАИМЕНОВАНИЕ</th><th style="text-align:right">КОЛ-ВО</th></tr>{rows}</table>
<div style="margin-top:30px;font-size:26px;line-height:1.45;border-top:3px solid #3a2f1c;padding-top:14px"><b>Примечание:</b> ювелирных украшений (включая кольца) в номере не обнаружено. Чёрных тканей (кроме той, что на зеркале) в багаже нет.</div>
<div style="margin-top:44px;font-size:25px;display:flex;justify-content:space-between;align-items:flex-end"><span>Опись составил: <span class="ink" style="font-size:44px">M. Webb</span> М. УЭББ</span><span>Итого: 5 позиций</span></div>
''', rot=-0.6, stamp='<div class="stamp" style="right:330px;bottom:70px;font-size:24px;transform:rotate(7deg)">ВЕЩДОКИ<br>БЕЛМОНТ</div>')

from playwright.sync_api import sync_playwright
pages={'patrol_report_ru.jpg':d01,'autopsy_report_ru.jpg':d02,'inventory_ru.jpg':d03}
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':2000,'height':1100})
    for fn,h in pages.items():
        pg.set_content(BASE.replace('@@BODY@@',h)); pg.wait_for_timeout(300); pg.screenshot(path=OUT+fn,type='jpeg',quality=84)
    b.close()
print('ok')
