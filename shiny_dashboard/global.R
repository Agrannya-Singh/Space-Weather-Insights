# global.R - Shared resources and setup for Shiny Dashboard

# Suppress startup messages for cleaner logs
suppressPackageStartupMessages({
  library(shiny)
  library(bslib)
  library(ggplot2)
  library(DT)
  library(httr2)
  library(jsonlite)
  library(dplyr)
  library(purrr)
  library(tidyr)
  library(lubridate)
  library(logger)
  library(plotly)
})

# Configure professional structured logging
log_layout(layout_json())
log_threshold(INFO) # Set to INFO for production-grade noise reduction

# Source modular R files
source("R/nasa_api.R")
source("R/eda_engine.R")
source("R/plots.R")

# Constants
EVENT_TYPES <- c(
  "Coronal Mass Ejection (CME)" = "CME",
  "Solar Flare (FLR)" = "FLR",
  "Geomagnetic Storm (GST)" = "GST",
  "Interplanetary Shock (IPS)" = "IPS",
  "High Speed Stream (HSS)" = "HSS",
  "Solar Energetic Particle (SEP)" = "SEP",
  "Magnetopause Crossing (MPC)" = "MPC",
  "Radiation Belt Enhancement (RBE)" = "RBE"
)

# Helper: Format date for NASA API
format_nasa_date <- function(d) {
  format(as.Date(d), "%Y-%m-%d")
}

# Theme: Space-inspired dark theme
space_theme <- bs_theme(
  version = 5,
  bootswatch = "darkly",
  primary = "#0B3D91",      # NASA Blue
  secondary = "#f59e0b",    # Gold/Amber
  success = "#34d399",      # Emerald
  base_font = font_google("Inter"),
  heading_font = font_google("Outfit")
) %>%
  bs_add_rules(
    ".card { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }"
  )
