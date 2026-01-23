# R/plots.R - Visualization logic using ggplot2

#' Plot distribution of a numeric field
render_numeric_plot <- function(df, field_name) {
  p <- ggplot(df, aes(x = !!sym(field_name))) +
    geom_histogram(fill = "#0B3D91", color = "white", bins = 30, alpha = 0.8) +
    theme_minimal() +
    labs(
      title = paste("Distribution of", field_name),
      x = field_name,
      y = "Frequency"
    ) +
    theme(
      plot.title = element_text(face = "bold", size = 14),
      panel.grid.minor = element_blank()
    )
  return(p)
}

#' Plot top categorical values
render_categorical_plot <- function(df, field_name) {
  counts <- df %>%
    count(!!sym(field_name), sort = TRUE) %>%
    head(12)
  
  p <- ggplot(counts, aes(x = reorder(!!sym(field_name), n), y = n)) +
    geom_col(fill = "#f59e0b", alpha = 0.8) +
    coord_flip() +
    theme_minimal() +
    labs(
      title = paste("Top", field_name),
      x = NULL,
      y = "Count"
    ) +
    theme(
      plot.title = element_text(face = "bold", size = 14),
      panel.grid.minor = element_blank()
    )
  return(p)
}

#' Plot events over time
render_timeseries_plot <- function(df, time_field) {
  # Robustly parse date
  df$date_only <- as.Date(as.POSIXct(df[[time_field]], format="%Y-%m-%dT%H:%MZ", tz="UTC"))
  
  counts <- df %>%
    group_by(date_only) %>%
    summarise(count = n())
  
  p <- ggplot(counts, aes(x = date_only, y = count)) +
    geom_line(color = "#34d399", linewidth = 1) +
    geom_point(color = "#34d399", size = 2) +
    theme_minimal() +
    labs(
      title = "Event Frequency Over Time",
      x = "Date",
      y = "Number of Events"
    ) +
    theme(
      plot.title = element_text(face = "bold", size = 14),
      panel.grid.minor = element_blank()
    )
  return(p)
}

#' Generate Correlation Heatmap
render_correlation_heatmap <- function(cor_matrix) {
  if (is.null(cor_matrix)) return(NULL)
  
  cor_df <- as.data.frame(as.table(cor_matrix))
  names(cor_df) <- c("Var1", "Var2", "Correlation")
  
  p <- ggplot(cor_df, aes(Var1, Var2, fill = Correlation)) +
    geom_tile() +
    scale_fill_gradient2(low = "#F43F5E", high = "#10B981", mid = "white", midpoint = 0) +
    theme_minimal() +
    labs(title = "Correlation Matrix", x = NULL, y = NULL) +
    theme(axis.text.x = element_text(angle = 45, hjust = 1))
    
  return(p)
}
