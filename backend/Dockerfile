# Use the official R base image
FROM rocker/r-ver:4.3.1

# Install system dependencies required for R packages
RUN apt-get update -qq && apt-get install -y \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    make \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install R packages and VERIFY installation
RUN R -e "install.packages(c('plumber', 'jsonlite', 'ggplot2', 'dplyr', 'logger'), repos='https://cloud.r-project.org/')" \
    && R -e "if (!all(c('plumber', 'jsonlite', 'ggplot2', 'dplyr', 'logger') %in% installed.packages())) stop('Package installation failed')"

# Set the working directory
WORKDIR /app

# Copy the API script
COPY api.R .

# Expose the port (Render/Cloud Run usually use 8080 or the PORT env var)
EXPOSE 8080

# Entry point to run the Plumber API
# We use Sys.getenv('PORT') to respect the port assigned by the hosting provider
CMD ["R", "-e", "pr <- plumber::plumb('/app/api.R'); pr$run(host='0.0.0.0', port=as.integer(Sys.getenv('PORT', '8080')))"]
