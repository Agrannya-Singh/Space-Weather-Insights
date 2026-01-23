# ui.R - User Interface definition

ui <- page_sidebar(
  theme = space_theme,
  title = "Space Weather Insights - R Shiny",
  
  sidebar = sidebar(
    title = "Controls",
    width = 300,
    selectInput(
      "event_type", "Select Event Type",
      choices = EVENT_TYPES,
      selected = "CME"
    ),
    dateRangeInput(
      "date_range", "Select Date Range",
      start = Sys.Date() - 30,
      end = Sys.Date()
    ),
    hr(),
    actionButton("refresh", "Fetch Data", class = "btn-primary w-100"),
    br(),
    helpText("Note: NASA API keys can be set in .Renviron or as env var.")
  ),
  
  layout_column_wrap(
    width = 1,
    navset_card_pill(
      id = "main_tabs",
      
      nav_panel(
        "Overview",
        layout_column_wrap(
          width = 1/3,
          value_box(
            title = "Row Count",
            value = textOutput("row_count"),
            showcase = bsicons::bs_icon("table"),
            theme = "primary"
          ),
          value_box(
            title = "Field Count",
            value = textOutput("field_count"),
            showcase = bsicons::bs_icon("columns-gap"),
            theme = "info"
          ),
          value_box(
            title = "Missing Percent",
            value = textOutput("missing_summary"),
            showcase = bsicons::bs_icon("exclamation-triangle"),
            theme = "warning"
          )
        ),
        card(
          card_header("Dataset Fields Summary"),
          DTOutput("summary_table")
        )
      ),
      
      nav_panel(
        "Visualizations",
        layout_column_wrap(
          width = 1/2,
          card(
            card_header("Numeric Distribution"),
            selectInput("num_field", "Select Numeric Field", choices = NULL),
            plotOutput("numeric_plot")
          ),
          card(
            card_header("Categorical Distribution"),
            selectInput("cat_field", "Select Categorical Field", choices = NULL),
            plotOutput("categorical_plot")
          )
        )
      ),
      
      nav_panel(
        "Time Series",
        card(
          card_header("Events Over Time"),
          plotOutput("ts_plot")
        )
      ),
      
      nav_panel(
        "Data Explorer",
        card(
          card_header("Raw Data View"),
          DTOutput("raw_data_table")
        )
      )
    )
  )
)
