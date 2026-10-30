# Etapa de compilación: restaura paquetes (incluida la biblioteca compartida MarketData.Data) y publica en Release.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore sobre los .csproj antes del código para reutilizar la capa de paquetes.
COPY backend/MarketData/MarketData.Data/MarketData.Data.csproj backend/MarketData/MarketData.Data/
COPY backend/MarketData/MarketData.Api/MarketData.Api.csproj backend/MarketData/MarketData.Api/
RUN dotnet restore backend/MarketData/MarketData.Api/MarketData.Api.csproj

COPY backend/MarketData/MarketData.Data/ backend/MarketData/MarketData.Data/
COPY backend/MarketData/MarketData.Api/ backend/MarketData/MarketData.Api/
RUN dotnet publish backend/MarketData/MarketData.Api/MarketData.Api.csproj -c Release -o /app/publish --no-restore -p:UseAppHost=false

# Etapa final: runtime de ASP.NET Core con usuario no root.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "MarketData.Api.dll"]