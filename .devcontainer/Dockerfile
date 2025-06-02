FROM mcr.microsoft.com/devcontainers/ruby:3.2

# Install Node.js 20.x (for Jekyll dependencies)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get update && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Upgrade npm to latest (compatible with Node 20)
RUN npm install -g npm

# Install Jekyll and Bundler
RUN gem install bundler jekyll sass-embedded && \
    gem install github-pages --ignore-dependencies --conservative

# Fix permissions for RVM gems directory
RUN chown -R vscode:vscode /usr/local/rvm/gems/ /usr/local/rvm/

# Set working directory
WORKDIR /workspace