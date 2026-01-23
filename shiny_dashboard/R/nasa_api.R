# R/nasa_api.R - NASA DONKI API Interaction

#' Fetch NASA Space Weather Data
#' @param type Event type (e.g., 'CME', 'FLR')
#' @param start_date ISO date string
#' @param end_date ISO date string
fetch_nasa_donki <- function(type = "CME", start_date = NULL, end_date = NULL) {
  apiKey <- Sys.getenv("NASA_API_KEY", "DEMO_KEY")
  
  url <- "https://api.nasa.gov/DONKI/"
  
  req <- request(paste0(url, type)) %>%
    req_url_query(
      startDate = start_date,
      endDate = end_date,
      api_key = apiKey
    )
  
  log_info("Fetching NASA DONKI data for {type} from {start_date} to {end_date}")
  
  tryCatch({
    res <- req_perform(req)
    data <- res %>% resp_body_json(simplifyVector = TRUE)
    
    if (length(data) == 0) return(data.frame())
    
    # Process data based on type
    processed <- process_donki_data(data, type)
    return(processed)
    
  }, error = function(e) {
    log_error("Failed to fetch NASA data: {e$message}")
    return(data.frame(error = e$message))
  })
}

#' Pre-process and flatten DONKI data
#' Mirrored from src/lib/eda.ts -> preprocessData
process_donki_data <- function(df, type) {
  if (!is.data.frame(df)) {
    # If it's a list but not a data frame (common in some NASA responses)
    # we might need more complex flattening
    return(as.data.frame(df))
  }
  
  if (type == "CME") {
    # Extract most accurate analysis
    if ("cmeAnalyses" %in% names(df)) {
       # This is tricky in R with nested data frames. 
       # For simplicity in a dashboard, we'll flatten what we can.
    }
  } else if (type == "FLR") {
    # Extract intensity
    if ("classType" %in% names(df)) {
      df$intensity_value <- as.numeric(gsub("[A-Z]", "", df$classType))
    }
    # Calculate duration
    if ("beginTime" %in% names(df) && "endTime" %in% names(df)) {
       df$duration_minutes <- as.numeric(difftime(
         as.POSIXct(df$endTime, format="%Y-%m-%dT%H:%MZ"),
         as.POSIXct(df$beginTime, format="%Y-%m-%dT%H:%MZ"),
         units = "mins"
       ))
    }
  }
  
  return(df)
}

# Helper to try and flatten complex nested lists/dfs
flatten_donki <- function(data) {
  # Simple flattening for demonstration
  # In a production app, we'd use tidyr::unnest or similar
  return(data)
}
