import random
import pandas as pd
import io
from js import document, Blob, URL, FileReader, Uint8Array
from pyodide.ffi import create_proxy

download_url = None  # Store the blob URL globally

def reset_download_button(event=None):
    global download_url
    link = document.getElementById("download-steekproef")
    link.classList.add("disabled")
    link.setAttribute("aria-disabled", "true")
    link.style.pointerEvents = "none"
    link.style.opacity = "0.6"
    download_url = None
    indicator = document.getElementById("processing-indicator-steekproef")
    indicator.style.display = "none"

def trigger_download(event):
    global download_url
    event.preventDefault()
    if download_url:
        a = document.createElement("a")
        a.href = download_url
        a.download = "steekproef_" + document.getElementById("steekproefFile").files.item(0).name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

def process_file(event):
    file_input = document.getElementById("steekproefFile")
    reset_download_button()
    file = file_input.files.item(0)
    reader = FileReader.new()

    def onload(e):
        global download_url
        # Convert ArrayBuffer to bytes for pandas
        array = Uint8Array.new(e.target.result)
        data = bytes(array.to_py())
        file_like = io.BytesIO(data)

        try:
            setup_df = pd.read_excel(file_like, sheet_name='Setup')
        except ValueError:
            random_seed = random.randint(0, 10**9 - 1)
            setup_df = pd.DataFrame({'Random Seed': [random_seed]})
        seed = int(setup_df['Random Seed'].loc[0])
        random.seed(seed)

        output_stream = io.BytesIO()
        with pd.ExcelWriter(output_stream, engine='openpyxl') as writer:
            setup_df.to_excel(writer, sheet_name='Setup', index=False)
            # Rewind file_like for reading sheets again
            file_like.seek(0)
            sheet_names = pd.ExcelFile(file_like).sheet_names
            for sheet in sheet_names:
                if sheet != 'Setup':
                    try:
                        file_like.seek(0)
                        df = pd.read_excel(file_like, sheet_name=sheet, header=0)
                        df = df.dropna(how='all')
                        df['Rand'] = [random.random() for _ in range(len(df))]
                        df = df.sort_values(by='Rand').reset_index(drop=True)
                        df.to_excel(writer, sheet_name=sheet, index=False)
                    except Exception as e:
                        print(f"Sheet skipped: {sheet}, Error: {e}")

        output_stream.seek(0)
        data = output_stream.getvalue()
        uint8 = Uint8Array.new(list(data))
        blob = Blob.new([uint8], { "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
        download_url = URL.createObjectURL(blob)

        # Enable the button
        link = document.getElementById("download-steekproef")
        link.classList.remove("disabled")
        link.setAttribute("aria-disabled", "false")
        link.style.pointerEvents = "auto"
        link.style.opacity = "1"
        indicator = document.getElementById("processing-indicator-steekproef")
        indicator.style.display = "none"

    reader.onload = create_proxy(onload)
    reader.readAsArrayBuffer(file)

# Listen for the custom event instead of "change"
document.getElementById("steekproefFile").addEventListener("process-excel", create_proxy(process_file))
# Listen for the download button click
document.getElementById("download-steekproef").addEventListener("click", create_proxy(trigger_download))
