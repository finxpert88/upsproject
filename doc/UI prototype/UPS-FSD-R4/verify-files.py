from pathlib import Path
from pypdf import PdfReader
import openpyxl,json,csv,pdfplumber
p=Path(__file__).resolve().parent/'tmp'/'verified'
expect=json.loads((p/'expected.json').read_text(encoding='utf-8'))
wb=openpyxl.load_workbook(p/'REP-01.xlsx',data_only=False)
assert wb.sheetnames==['说明','指标字典','数据质量','当前健康','运行概览','明细','告警事件'],wb.sheetnames
assert wb['说明']['B2'].value=='模拟数据 / simulation'
assert wb['明细'].max_row==len(expect['details'])+1
assert wb['运行概览']['C2'].value==expect['summary'][0][2]
assert wb['运行概览']['C2'].data_type=='n'
assert wb['明细'].freeze_panes=='A2'
assert all(c.data_type!='f' for s in wb for row in s for c in row)
for pdf in p.glob('*.pdf'):
 reader=PdfReader(pdf);texts=[page.extract_text() for page in reader.pages]
 assert all('模拟数据' in text for text in texts)
 assert all('第 ' in text for text in texts)
 assert all(len(page['/Resources']['/Font']['/F1']['/DescendantFonts'][0].get_object()['/FontDescriptor']['/FontFile2'].get_data())>10000 for page in reader.pages)
 with pdfplumber.open(pdf) as doc:
  for index,page in enumerate(doc.pages):
   assert all(c['x0']>=20 and c['x1']<=825 and c['top']>=10 and c['bottom']<=590 for c in page.chars), (pdf.name,index,'clipped')
   page.to_image(resolution=110).save(p/(pdf.stem+'-'+str(index+1)+'.png'))
 print(pdf.name,len(reader.pages),'pages; embedded Chinese font; text bounds passed')
rows=list(csv.reader((p/'REP-02.csv').open(encoding='utf-8-sig',newline='')))
assert len(rows)>1000 and rows[0][1]=='模拟数据'
print('XLSX opened with typed numbers, all seven sheets; CSV parsed:',len(rows),'rows')
