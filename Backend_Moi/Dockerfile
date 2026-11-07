FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["tuan1&2_tv2_cnpm.csproj", "./"]
RUN dotnet restore "tuan1&2_tv2_cnpm.csproj"
COPY . .
RUN dotnet build "tuan1&2_tv2_cnpm.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "tuan1&2_tv2_cnpm.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BackendApi.dll"]