# app.R - Application entry point
# Run this file to start the dashboard

# Note: In a modular Shiny app, Shiny automatically looks for 
# ui.R, server.R, and global.R in the same directory.
# This file is provided for convenience.

library(shiny)

# Source global to ensure everything is loaded if running manually
# source("global.R") 

shinyApp(ui = ui, server = server)
