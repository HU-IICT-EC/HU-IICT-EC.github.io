import random
import pandas as pd
import io
from js import document, Blob, URL, FileReader, Uint8Array
from pyodide.ffi import create_proxy

# Constants
RANDOM_SEED_MAX = 10**9 - 1
DOWNLOAD_BUTTON_ID = 'download-steekproef'
FILE_INPUT_ID = 'steekproefFile'
PROCESSING_INDICATOR_ID = 'processing-indicator-steekproef'
SETUP_SHEET_NAME = 'Setup'

download_url = None  # Store the blob URL globally


def _reset_download_button():
    """Reset the download button to disabled state."""
    global download_url
    link = document.getElementById(DOWNLOAD_BUTTON_ID)
    link.classList.add('disabled')
    link.setAttribute('aria-disabled', 'true')
    link.style.pointerEvents = 'none'
    link.style.opacity = '0.6'
    download_url = None
    
    indicator = document.getElementById(PROCESSING_INDICATOR_ID)
    indicator.style.display = 'none'


def _enable_download_button():
    """Enable the download button."""
    link = document.getElementById(DOWNLOAD_BUTTON_ID)
    link.classList.remove('disabled')
    link.setAttribute('aria-disabled', 'false')
    link.style.pointerEvents = 'auto'
    link.style.opacity = '1'
    
    indicator = document.getElementById(PROCESSING_INDICATOR_ID)
    indicator.style.display = 'none'


def reset_download_button(event=None):
    """Public interface for resetting download button."""
    _reset_download_button()


def trigger_download(event):
    """Handle download button click."""
    global download_url
    event.preventDefault()
    if download_url:
        file_input = document.getElementById(FILE_INPUT_ID)
        original_filename = file_input.files.item(0).name
        
        a = document.createElement('a')
        a.href = download_url
        a.download = f'steekproef_{original_filename}'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)


def process_file(event):
    """Process the uploaded Excel file and create randomized sample."""
    global download_url
    
    file_input = document.getElementById(FILE_INPUT_ID)
    _reset_download_button()
    
    file = file_input.files.item(0)
    reader = FileReader.new()

    def onload(e):
        global download_url
        try:
            # Convert ArrayBuffer to bytes for pandas
            array = Uint8Array.new(e.target.result)
            data = bytes(array.to_py())
            file_like = io.BytesIO(data)

            # Read or create setup sheet with random seed
            try:
                setup_df = pd.read_excel(file_like, sheet_name=SETUP_SHEET_NAME)
            except ValueError:
                random_seed = random.randint(0, RANDOM_SEED_MAX)
                setup_df = pd.DataFrame({'Random Seed': [random_seed]})
            
            seed = int(setup_df['Random Seed'].iloc[0])
            random.seed(seed)

            # Create output Excel file
            output_stream = io.BytesIO()
            with pd.ExcelWriter(output_stream, engine='openpyxl') as writer:
                # Write setup sheet
                setup_df.to_excel(writer, sheet_name=SETUP_SHEET_NAME, index=False)
                
                # Process data sheets
                file_like.seek(0)
                excel_file = pd.ExcelFile(file_like)
                
                for sheet_name in excel_file.sheet_names:
                    if sheet_name != SETUP_SHEET_NAME:
                        try:
                            df = pd.read_excel(excel_file, sheet_name=sheet_name, header=0)
                            df = df.dropna(how='all')
                            df['Rand'] = [random.random() for _ in range(len(df))]
                            df = df.sort_values(by='Rand').reset_index(drop=True)
                            df.to_excel(writer, sheet_name=sheet_name, index=False)
                        except Exception as e:
                            print(f'[steekproef] Sheet skipped: {sheet_name}, Error: {e}')

            # Create downloadable blob
            output_stream.seek(0)
            data = output_stream.getvalue()
            uint8 = Uint8Array.new(list(data))
            blob = Blob.new([uint8], {
                'type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })
            download_url = URL.createObjectURL(blob)
            
            _enable_download_button()

        except Exception as err:
            print(f'[steekproef] Error processing file: {err}')
            _reset_download_button()

    reader.onload = create_proxy(onload)
    reader.readAsArrayBuffer(file)


# Event listeners
document.getElementById(FILE_INPUT_ID).addEventListener(
    'process-excel', create_proxy(process_file)
)
document.getElementById(DOWNLOAD_BUTTON_ID).addEventListener(
    'click', create_proxy(trigger_download)
)
