# E2E Test: Upload JSON File via Browse Files

Test uploading a custom JSON file through the Browse Files button and verifying the table appears correctly in Available Tables.

## User Story

As a user
I want to upload my own JSON file using the Browse Files button
So that I can query my JSON data using natural language

## Test Steps

1. Navigate to the `Application URL`
2. Take a screenshot of the initial state
3. **Verify** the "No tables loaded" message (`.no-tables`) is visible in the `#tables-list` section
4. Create a temporary JSON file at `/tmp/test_cities.json` with the following content:
   ```json
   [
     {"id": 1, "city": "New York", "population": 8336817, "country": "USA"},
     {"id": 2, "city": "Los Angeles", "population": 3979576, "country": "USA"},
     {"id": 3, "city": "Chicago", "population": 2693976, "country": "USA"}
   ]
   ```
5. Click the "Upload Data" button (`#upload-data-button`) to open the upload modal
6. **Verify** the upload modal (`#upload-modal`) is visible
7. **Verify** the "Browse Files" button (`#browse-button`) is visible inside the drop zone (`#drop-zone`)
8. Take a screenshot of the upload modal
9. Upload the file `/tmp/test_cities.json` via the hidden file input (`#file-input`)
10. Wait for the upload to complete and the modal to close
11. **Verify** the `.no-tables` message is no longer visible in `#tables-list`
12. **Verify** a `.table-item` element exists in `#tables-list`
13. **Verify** the table name shown in `.table-name` is "test_cities"
14. **Verify** the table info shown in `.table-info` contains "3 rows" and "4 columns"
15. **Verify** column tags (`.column-tag`) are displayed showing the column names: "id", "city", "population", "country"
16. Take a screenshot of the Available Tables section showing the uploaded table
17. Clean up the temporary JSON file at `/tmp/test_cities.json`

## Success Criteria
- Upload Data modal opens when the button is clicked
- Browse Files button and drop zone are visible in the modal
- JSON file is uploaded successfully via the file input
- The uploaded table appears in Available Tables with the correct name "test_cities"
- Row count (3) and column count (4) are displayed correctly
- Column names are shown as column tags
- 3 screenshots are taken
