# E2E Test: Drag and Drop File Upload

Test uploading files by dragging them directly onto the `#drop-zone` area inside the Upload Data modal.

## User Story

As a user
I want to drag and drop a CSV file onto the upload drop zone
So that I can quickly load my data without clicking Browse Files

## Test Steps

1. Navigate to the `Application URL`
2. Take a screenshot of the initial state
3. **Verify** the "No tables loaded" message (`.no-tables`) is visible in the `#tables-list` section
4. Create a temporary CSV file at `/tmp/test_drag_products.csv` with the following content:
   ```
   product,price,stock
   Widget,9.99,150
   Gadget,24.50,80
   Doohickey,4.75,300
   ```
5. Click the "Upload Data" button (`#upload-data-button`) to open the upload modal
6. **Verify** the upload modal (`#upload-modal`) is visible
7. **Verify** the drop zone (`#drop-zone`) is visible with the text "Drag and drop .csv, .json, or .jsonl files here"
8. Take a screenshot of the upload modal showing the drop zone
9. Simulate a drag-and-drop file upload by dispatching a `drop` event on the `#drop-zone` element with the file `/tmp/test_drag_products.csv`. Use Playwright's `page.locator('#drop-zone').dispatchEvent('drop', ...)` or equivalent `browser_run_code` to create a `DataTransfer` containing the file and dispatch the drop event.
10. Wait for the upload to complete and the modal to close
11. **Verify** the `.no-tables` message is no longer visible in `#tables-list`
12. **Verify** a `.table-item` element exists in `#tables-list`
13. **Verify** the table name shown in `.table-name` is "test_drag_products"
14. **Verify** the table info shown in `.table-info` contains "3 rows" and "3 columns"
15. **Verify** column tags (`.column-tag`) are displayed showing the column names: "product", "price", "stock"
16. Take a screenshot of the Available Tables section showing the uploaded table
17. Clean up the temporary CSV file at `/tmp/test_drag_products.csv`

## Success Criteria
- Upload Data modal opens when the button is clicked
- Drop zone is visible inside the modal with descriptive text
- CSV file is uploaded successfully via drag-and-drop onto `#drop-zone`
- The uploaded table appears in Available Tables with the correct name "test_drag_products"
- Row count (3) and column count (3) are displayed correctly
- Column names are shown as column tags
- 3 screenshots are taken
