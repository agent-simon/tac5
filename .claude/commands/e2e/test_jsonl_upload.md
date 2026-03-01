# E2E Test: Upload JSONL File via Browse Files

Test uploading a custom JSONL (newline-delimited JSON) file through the Browse Files button and verifying the table appears correctly in Available Tables.

## User Story

As a user
I want to upload my own JSONL file using the Browse Files button
So that I can query my newline-delimited JSON data using natural language

## Test Steps

1. Navigate to the `Application URL`
2. Take a screenshot of the initial state
3. **Verify** the "No tables loaded" message (`.no-tables`) is visible in the `#tables-list` section
4. Create a temporary JSONL file at `/tmp/test_orders.jsonl` with the following content (one JSON object per line, no trailing newline):
   ```
   {"id": 1, "product": "Laptop", "price": 999.99, "in_stock": true}
   {"id": 2, "product": "Mouse", "price": 29.99, "in_stock": true}
   {"id": 3, "product": "Keyboard", "price": 79.99, "in_stock": false}
   ```
5. Click the "Upload Data" button (`#upload-data-button`) to open the upload modal
6. **Verify** the upload modal (`#upload-modal`) is visible
7. **Verify** the drop zone text mentions `.jsonl` files (element `#drop-zone`)
8. **Verify** the "Browse Files" button (`#browse-button`) is visible inside the drop zone (`#drop-zone`)
9. Take a screenshot of the upload modal
10. Upload the file `/tmp/test_orders.jsonl` via the hidden file input (`#file-input`)
11. Wait for the upload to complete and the modal to close
12. **Verify** the `.no-tables` message is no longer visible in `#tables-list`
13. **Verify** a `.table-item` element exists in `#tables-list`
14. **Verify** the table name shown in `.table-name` is "test_orders"
15. **Verify** the table info shown in `.table-info` contains "3 rows" and "4 columns"
16. **Verify** column tags (`.column-tag`) are displayed showing the column names: "id", "product", "price", "in_stock"
17. Take a screenshot of the Available Tables section showing the uploaded table
18. Clean up the temporary JSONL file at `/tmp/test_orders.jsonl`

## Success Criteria
- Upload Data modal opens when the button is clicked
- Drop zone text confirms `.jsonl` is a supported format
- Browse Files button and drop zone are visible in the modal
- JSONL file is uploaded successfully via the file input
- The uploaded table appears in Available Tables with the correct name "test_orders"
- Row count (3) and column count (4) are displayed correctly
- Column names are shown as column tags
- 3 screenshots are taken
