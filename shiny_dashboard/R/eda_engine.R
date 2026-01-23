# R/eda_engine.R - Statistical Analysis Engine

#' Infer column types and generate summary stats
#' Mirrored from src/lib/eda.ts -> analyzeDataset
analyze_dataset <- function(df) {
  if (nrow(df) == 0) return(NULL)
  
  fields <- names(df)
  summary_list <- list()
  
  for (f in fields) {
    col_data <- df[[f]]
    non_na <- col_data[!is.na(col_data)]
    
    type <- infer_r_type(col_data)
    
    common_stats <- list(
      field = f,
      type = type,
      missing_count = sum(is.na(col_data)),
      missing_percent = (sum(is.na(col_data)) / nrow(df)) * 100
    )
    
    # Numeric analysis
    if (type %in% c("numeric", "integer")) {
      nums <- as.numeric(non_na)
      if (length(nums) > 0) {
        common_stats$numeric <- list(
          min = min(nums, na.rm = TRUE),
          max = max(nums, na.rm = TRUE),
          mean = mean(nums, na.rm = TRUE),
          median = median(nums, na.rm = TRUE),
          stddev = sd(nums, na.rm = TRUE),
          p25 = quantile(nums, 0.25, na.rm = TRUE),
          p75 = quantile(nums, 0.75, na.rm = TRUE)
        )
      }
    }
    
    # Categorical analysis
    if (type %in% c("character", "logical", "factor")) {
      counts <- table(as.character(col_data))
      sorted_counts <- sort(counts, decreasing = TRUE)
      common_stats$categorical <- head(as.data.frame(sorted_counts), 10)
      names(common_stats$categorical) <- c("value", "count")
    }
    
    summary_list[[f]] <- common_stats
  }
  
  return(list(
    row_count = nrow(df),
    field_count = ncol(df),
    summary = summary_list
  ))
}

#' Simple type inference
infer_r_type <- function(x) {
  if (is.numeric(x)) {
    if (all(x == floor(x), na.rm = TRUE)) return("integer")
    return("numeric")
  }
  if (is.logical(x)) return("logical")
  if (is.character(x)) {
    # Try to detect dates
    try_date <- as.POSIXct(head(x, 20), format="%Y-%m-%dT%H:%MZ", tz="UTC")
    if (any(!is.na(try_date))) return("datetime")
    return("character")
  }
  return(typeof(x))
}

#' Calculate correlation matrix for numeric fields
calc_correlations <- function(df) {
  numeric_df <- df %>% select(where(is.numeric))
  if (ncol(numeric_df) < 2) return(NULL)
  
  cor_matrix <- cor(numeric_df, use = "pairwise.complete.obs")
  return(cor_matrix)
}
