using Property.Common;
using Property.Dtos;
using Property.Models;
using Property.Repositories;

namespace Property.Services;

public class ProvinceService : IProvinceService
{
    private readonly IProvinceRepository _provinceRepository;

    public ProvinceService(IProvinceRepository provinceRepository)
    {
        _provinceRepository = provinceRepository;
    }

    public async Task<IEnumerable<ProvinceDto>> GetAllAsync()
    {
        var provinces = await _provinceRepository.GetAllAsync();
        return provinces.Select(MapToDto);
    }

    public async Task<Result<ProvinceDto>> GetByCodeAsync(string provinceCode)
    {
        var province = await _provinceRepository.GetByCodeIneAsync(provinceCode);

        if (province is null)
        {
            return Result<ProvinceDto>.Failure(ResultError.NotFound);
        }

        return Result<ProvinceDto>.Success(MapToDto(province));
    }

    private static ProvinceDto MapToDto(Province province)
    {
        return new ProvinceDto
        {
            ProvinceCode = province.CodeIne,
            Name = province.Name,
            AutonomousCommunity = province.AutonomousCommunity,
            Population = province.Population
        };
    }
}