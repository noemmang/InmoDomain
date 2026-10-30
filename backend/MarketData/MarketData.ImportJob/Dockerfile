# Etapa de compilación: restaura paquetes (incluida la biblioteca compartida MarketData.Data) y publica en Release.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore sobre los .csproj antes del código para reutilizar la capa de paquetes.
COPY backend/MarketData/MarketData.Data/MarketData.Data.csproj backend/MarketData/MarketData.Data/
COPY backend/MarketData/MarketData.ImportJob/MarketData.ImportJob.csproj backend/MarketData/MarketData.ImportJob/
RUN dotnet restore backend/MarketData/MarketData.ImportJob/MarketData.ImportJob.csproj

COPY backend/MarketData/MarketData.Data/ backend/MarketData/MarketData.Data/
COPY backend/MarketData/MarketData.ImportJob/ backend/MarketData/MarketData.ImportJob/
RUN dotnet publish backend/MarketData/MarketData.ImportJob/MarketData.ImportJob.csproj -c Release -o /app/publish --no-restore -p:UseAppHost=false

# Etapa final: runtime de consola (sin ASP.NET Core) con usuario no root.
FROM mcr.microsoft.com/dotnet/runtime:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

USER $APP_UID
ENTRYPOINT ["dotnet", "MarketData.ImportJob.dll"]