# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - heading "Exploratory Data Analysis" [level=2] [ref=e3]
    - generic [ref=e4]:
      - generic [ref=e6]: Load Data
      - generic [ref=e7]:
        - generic [ref=e8]:
          - generic [ref=e9]: "Format:"
          - combobox [ref=e10]:
            - option "JSON" [selected]
            - option "CSV"
          - button "Choose File" [ref=e11]
          - button "Analyze" [disabled]
        - textbox "Paste JSON array here" [ref=e12]
  - region "Notifications (F8)":
    - list
  - alert [ref=e13]
```