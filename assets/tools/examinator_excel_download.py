import pandas as pd
from js import document, Blob, URL, FileReader, Uint8Array, alert
from pyodide.ffi import create_proxy
from bs4 import BeautifulSoup
from openpyxl import load_workbook
from openpyxl.worksheet.table import Table, TableStyleInfo
import io

download_url = None  # Store the blob URL globally

def reset_download_button(event=None):
    global download_url
    link = document.getElementById("download-examinator")
    link.classList.add("disabled")
    link.setAttribute("aria-disabled", "true")
    link.style.pointerEvents = "none"
    link.style.opacity = "0.6"
    download_url = None
    indicator = document.getElementById("processing-indicator-examinator")
    indicator.style.display = "none"

def trigger_download(event):
    global download_url
    event.preventDefault()
    if download_url:
        a = document.createElement("a")
        a.href = download_url
        a.download = "osiris.xlsx"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

def process_file(event):
    file_input = document.getElementById("examinatorFile")
    if not file_input.files.length:
        reset_download_button()
        return
    link = document.getElementById("download-examinator")
    link.classList.add("disabled")
    link.setAttribute("aria-disabled", "true")
    link.style.pointerEvents = "none"
    link.style.opacity = "0.6"
    file = file_input.files.item(0)
    reader = FileReader.new()

    def onload(e):
        global download_url

        webpage = e.target.result

        osiris = BeautifulSoup(webpage, "html.parser")
        examiners_rows = []

        for p in osiris.select('p.c51'):
            medewerker = p.text.split()[-1][1:-1]
            table = p.find_next("table")
            if not table:
                continue
            for course in table.select('td.c62 span.c64'):
                dict1 = {}
                dict1['Medewerker'] = medewerker
                dict1['Cursus'] = course.text
                examiners_rows.append(dict1)

        df = pd.DataFrame(examiners_rows)
        excel_buffer = io.BytesIO()
        df.to_excel(excel_buffer, index=False, sheet_name="Sheet1")
        excel_buffer.seek(0)

        wb = load_workbook(excel_buffer)
        ws = wb["Sheet1"]
        tab = Table(displayName="ExaminatorTable", ref=ws.dimensions)
        style = TableStyleInfo(
            name="TableStyleMedium2",
            showFirstColumn=False,
            showLastColumn=False,
            showRowStripes=True,
            showColumnStripes=False
        )
        tab.tableStyleInfo = style
        ws.add_table(tab)

        for column_cells in ws.columns:
            length = max(len(str(cell.value)) if cell.value is not None else 0 for cell in column_cells)
            col_letter = column_cells[0].column_letter
            ws.column_dimensions[col_letter].width = length + 2

        excel_buffer2 = io.BytesIO()
        wb.save(excel_buffer2)
        excel_buffer2.seek(0)

        data = excel_buffer2.getvalue()
        uint8 = Uint8Array.new(list(data))
        blob = Blob.new([uint8], { "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
        download_url = URL.createObjectURL(blob)
        # Enable the button
        link.classList.remove("disabled")
        link.setAttribute("aria-disabled", "false")
        link.style.pointerEvents = "auto"
        link.style.opacity = "1"
        indicator = document.getElementById("processing-indicator-examinator")
        indicator.style.display = "none"

    reader.onload = create_proxy(onload)
    reader.readAsText(file)

# Listen for the custom event instead of "change"
document.getElementById("examinatorFile").addEventListener("process-excel", create_proxy(process_file))
# Listen for the download button click
document.getElementById("download-examinator").addEventListener("click", create_proxy(trigger_download))