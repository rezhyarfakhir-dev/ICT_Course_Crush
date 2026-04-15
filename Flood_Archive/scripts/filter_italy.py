# ============================================================
# filter_italy.py
# ============================================================
# What this script does (in plain English):
#
# 1. Opens the FloodArchive Excel file (the one with 5,130 flood events).
# 2. Looks at the "Country" column and keeps ONLY the rows where
#    the country is "Italy".
# 3. Saves those Italy-only rows into a brand-new CSV file.
# 4. Prints a short summary so you know it worked.
# ============================================================

# --- Step 1: Import pandas ---------------------------------
# pandas is a popular Python library for working with tables
# (like Excel spreadsheets). We import it and give it the
# short nickname "pd" so we don't have to type "pandas" every time.
import pandas as pd

# --- Step 2: Read the Excel file ---------------------------
# pd.read_excel() opens an .xlsx file and loads it into a
# "DataFrame" — think of it as a table with rows and columns,
# just like what you see in Excel.
df = pd.read_excel("Flood_Archive/floodarchive_ckan.xlsx")

# Let's print how many rows we started with:
print(f"Total flood events in the file: {len(df)}")

# --- Step 3: Filter for Italy only -------------------------
# We create a new, smaller table that contains only the rows
# where the "Country" column equals "Italy".
#
# df["Country"] grabs the Country column.
# .str.strip()  removes leading/trailing spaces (the source
#               data has ' Italy' with a space for one row).
# == "Italy"   checks each row: is this Italy? (True/False)
# df[...]       keeps only the rows where the answer is True.
italy_df = df[df["Country"].str.strip() == "Italy"]

# Print how many rows matched:
print(f"Flood events in Italy: {len(italy_df)}")

# --- Step 4: Save to a new CSV file ------------------------
# .to_csv() writes the filtered table to a CSV file.
# index=False means "don't add an extra numbering column".
output_path = "Flood_Archive/data/floodarchive_italy.csv"
italy_df.to_csv(output_path, index=False)

print(f"Saved to: {output_path}")
print("Done!")
