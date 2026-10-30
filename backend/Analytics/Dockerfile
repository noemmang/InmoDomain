# Etapa de compilación: restaura paquetes y publica en Release.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore sobre el .csproj antes del código para reutilizar la capa de paquetes.
COPY backend/Analytics/Analytics.csproj backend/Analytics/
RUN dotnet restore backend/Analytics/Analytics.csproj

COPY backend/Analytics/ backend/Analytics/
RUN dotnet publish backend/Analytics/Analytics.csproj -c Release -o /app/publish --no-restore -p:UseAppHost=false

# Etapa final: runtime de ASP.NET Core con usuario no root.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Analytics.dll"]