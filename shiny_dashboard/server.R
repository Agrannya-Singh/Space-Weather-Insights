# server.R - Server logic definition

server <- function(input, output, session) {
  
  # Reactive values for storying data and analysis
  state <- reactiveValues(
    data = data.frame(),
    eda = NULL,
    loading = FALSE
  )
  
  # Fetch data when button is clicked or on init
  observeEvent(input$refresh, {
    state$loading <- TRUE
    
    withProgress(message = 'Fetching NASA Data...', value = 0.5, {
      df <- fetch_nasa_donki(
        type = input$event_type,
        start_date = format_nasa_date(input$date_range[1]),
        end_date = format_nasa_date(input$date_range[2])
      )
      
      state$data <- df
      if (nrow(df) > 0) {
        state$eda <- analyze_dataset(df)
        
        # Update dropdown choices
        # Filter out ID columns and other noise for cleaner UI
        valid_cols <- names(df)
        ignore_patterns <- "ID$|Id$|url$|link$|Time$|Name$|Note$|Enlil$|AU$|Catalog$"
        
        num_fields <- names(Filter(is.numeric, df))
        num_fields <- num_fields[!grepl(ignore_patterns, num_fields, ignore.case = TRUE)]
        
        cat_fields <- names(Filter(function(x) is.character(x) || is.factor(x) || is.logical(x), df))
        cat_fields <- cat_fields[!grepl(ignore_patterns, cat_fields, ignore.case = TRUE)]
        
        updateSelectInput(session, "num_field", choices = num_fields)
        updateSelectInput(session, "cat_field", choices = cat_fields)
      } else {
        state$eda <- NULL
      }
    })
    
    state$loading <- FALSE
  }, ignoreNULL = FALSE)
  
  # --- Outputs ---
  
  output$row_count <- renderText({ state$eda$row_count %||% 0 })
  output$field_count <- renderText({ state$eda$field_count %||% 0 })
  
  output$missing_summary <- renderText({
    if (is.null(state$eda)) return("0%")
    missing_pct <- mean(sapply(state$eda$summary, function(x) x$missing_percent))
    paste0(round(missing_pct, 1), "%")
  })
  
  output$summary_table <- renderDT({
    if (is.null(state$eda)) return(NULL)
    
    summary_df <- do.call(rbind, lapply(state$eda$summary, function(x) {
      data.frame(
        Field = x$field,
        Type = x$type,
        Missing = paste0(round(x$missing_percent, 1), "%"),
        Cardinality = if (!is.null(x$categorical)) nrow(x$categorical) else NA
      )
    }))
    
    datatable(summary_df, options = list(pageLength = 10, dom = 'tip'))
  })
  
  output$numeric_plot <- renderPlot({
    req(input$num_field, state$data)
    render_numeric_plot(state$data, input$num_field)
  })
  
  output$categorical_plot <- renderPlot({
    req(input$cat_field, state$data)
    render_categorical_plot(state$data, input$cat_field)
  })
  
  output$ts_plot <- renderPlot({
    req(state$data)
    # Find a datetime field if possible
    dt_field <- names(Filter(function(x) inherits(x, "POSIXct") || inherits(x, "Date"), state$data))[1]
    if (is.na(dt_field)) {
      # Fallback to beginTime/startTime
      potential <- c("beginTime", "startTime", "eventTime")
      dt_field <- intersect(potential, names(state$data))[1]
    }
    req(dt_field)
    render_timeseries_plot(state$data, dt_field)
  })
  
  output$globe_plot <- renderPlotly({
    req(state$data)
    render_globe_plot(state$data)
  })
  
  # Log session start
  log_info("Session started")
  
  # Log session end
  onStop(function() {
    log_info("Session ended")
  })
  
  output$raw_data_table <- renderDT({
    req(state$data)
    datatable(state$data, options = list(scrollX = TRUE, pageLength = 15))
  })
}
