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
  
  log_info("Fetching NASA DONKI data", type = type, start = start_date, end = end_date)
  
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
    df <- as.data.frame(df)
  }
  
  # Common cleanup: Remove typically noisy or complex columns early if they exist
  noisy_cols <- c("catalog", "link", "note", "instruments", "sourceLocation", 
                 "activeRegionNum", "submissionTime", "versionId")
  df <- df[, !(names(df) %in% noisy_cols), drop = FALSE]
  
  if (type == "CME") {
    # Extract analysis data if available
    if ("cmeAnalyses" %in% names(df)) {
      
      # helper to extract fields from the nested structure
      # cmeAnalyses is usually a list of data.frames
      extracted <- purrr::map_df(df$cmeAnalyses, function(x) {
        if (is.null(x) || (is.data.frame(x) && nrow(x) == 0) || length(x) == 0) {
          return(data.frame(
            latitude = NA_real_,
            longitude = NA_real_,
            halfAngle = NA_real_,
            speed = NA_real_,
            type = NA_character_
          ))
        }
        
        # Take the first analysis (most reliable/recent)
        first <- if (is.data.frame(x)) x[1, ] else x[[1]]
        
        data.frame(
          latitude = as.numeric(first$latitude),
          longitude = as.numeric(first$longitude),
          halfAngle = as.numeric(first$halfAngle),
          speed = as.numeric(first$speed),
          type = as.character(first$type)
        )
      })
      
      df <- cbind(df, extracted)
      df$cmeAnalyses <- NULL # Remove the nested column
    }
  } else if (type == "FLR") {
    if ("classType" %in% names(df)) {
      df$intensity_value <- as.numeric(gsub("[^0-9.]", "", df$classType))
    }
    
    if ("beginTime" %in% names(df) && "endTime" %in% names(df)) {
      # multiple formats might exist, try standard one
      start_t <- lubridate::ymd_hms(df$beginTime, quiet = TRUE)
      if (all(is.na(start_t))) start_t <- lubridate::ymd_hm(df$beginTime, quiet = TRUE)
      
      end_t <- lubridate::ymd_hms(df$endTime, quiet = TRUE)
      if (all(is.na(end_t))) end_t <- lubridate::ymd_hm(df$endTime, quiet = TRUE)
      
      df$duration_minutes <- as.numeric(difftime(end_t, start_t, units = "mins"))
    }
  }
  
  # Ensure ID columns like activityID are kept but maybe we filter them in UI later
  # For now, we removed technical IDs like versionId
  
  return(df)
}

# Helper to try and flatten complex nested lists/dfs
flatten_donki <- function(data) {
  # Simple flattening for demonstration
  # In a production app, we'd use tidyr::unnest or similar
  return(data)
}
