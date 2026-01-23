# R/plots.R - Visualization logic using ggplot2

#' Plot distribution of a numeric field
render_numeric_plot <- function(df, field_name) {
  # Clean data for plotting to avoid warnings
  clean_df <- df[!is.na(df[[field_name]]), ]
  
  if (nrow(clean_df) == 0) return(NULL)

  p <- ggplot(clean_df, aes(x = !!sym(field_name))) +
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
  # Clean data for plotting
  clean_df <- df[!is.na(df[[field_name]]), ]
  
  if (nrow(clean_df) == 0) return(NULL)

  counts <- clean_df %>%
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
  # Robustly parse date using lubridate
  parsed_dates <- lubridate::parse_date_time(df[[time_field]], 
                                            orders = c("ymd_HMS", "ymd_HM", "ymd_H", "ymd"),
                                            quiet = TRUE)
  df$date_only <- as.Date(parsed_dates)
  
  counts <- df %>%
    filter(!is.na(date_only)) %>%
    group_by(date_only) %>%
    summarise(count = n())
  
  if (nrow(counts) == 0) return(NULL)
  
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
    theme(
      axis.text.x = element_text(angle = 45, hjust = 1, color = "white"),
      axis.text.y = element_text(color = "white"),
      plot.title = element_text(color = "white", face = "bold"),
      legend.text = element_text(color = "white")
    )
    
  return(p)
}

#' Plot 3D Globe with Events (Heliocentric/Geocentric)
render_globe_plot <- function(df) {
  if (nrow(df) == 0) return(NULL)
  
  # Check if we have lat/long
  if (!all(c("latitude", "longitude") %in% names(df))) {
    return(NULL)
  }
  
  # Filter out NAs
  plot_data <- df %>% filter(!is.na(latitude) & !is.na(longitude))
  
  if (nrow(plot_data) == 0) return(NULL)
  
  # Create a 3D scatter plot representing the events
  # Using scattergeo for lat/long visualization on a sphere
  
  p <- plot_ly(plot_data, 
          lat = ~latitude, 
          lon = ~longitude, 
          type = 'scattergeo',
          mode = 'markers',
          marker = list(
            size = 10, 
            color = ~speed, # Color by speed if available
            colorscale = 'Viridis',
            showscale = TRUE,
            colorbar = list(title = "Speed (km/s)"),
            opacity = 0.9,
            line = list(color = 'white', width = 1)
          ),
          text = ~paste(
            "<b>Type:</b>", type, "<br>",
            "<b>Speed:</b>", speed, "km/s<br>",
            "<b>Lat:</b>", latitude, "<b>Lon:</b>", longitude, "<br>",
            "<b>Time:</b>", startTime
          )) %>%
    layout(
      title = list(text = "Solar Events Distribution (Heliographic)", font = list(color = "white")),
      geo = list(
        projection = list(type = 'orthographic'),
        showland = TRUE,
        landcolor = "#1f2937",  # Dark grey/blue
        showocean = TRUE,
        oceancolor = "#0B3D91", # NASA Blue
        showlakes = FALSE,
        showcountries = FALSE,
        showframe = FALSE,
        bgcolor = "rgba(0,0,0,0)", # transparent bg
        lonaxis = list(showgrid = TRUE, gridcolor = "rgba(255,255,255,0.2)"),
        lataxis = list(showgrid = TRUE, gridcolor = "rgba(255,255,255,0.2)")
      ),
      paper_bgcolor = "rgba(0,0,0,0)",
      plot_bgcolor = "rgba(0,0,0,0)",
      font = list(color = "white"),
      margin = list(t = 50, b = 0, l = 0, r = 0)
    )
    
  return(p)
}
