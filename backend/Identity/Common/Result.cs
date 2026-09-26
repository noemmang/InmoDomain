namespace Identity.Common;

public class Result
{
    public bool IsSuccess { get; }
    public ResultError Error { get; }

    protected Result(bool isSuccess, ResultError error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }

    public static Result Success() => new(true, ResultError.None);
    public static Result Failure(ResultError error) => new(false, error);
}

public class Result<T> : Result
{
    public T? Value { get; }

    private Result(T value) : base(true, ResultError.None)
    {
        Value = value;
    }

    private Result(ResultError error) : base(false, error)
    {
        Value = default;
    }

    public static Result<T> Success(T value) => new(value);
    public static new Result<T> Failure(ResultError error) => new(error);
}