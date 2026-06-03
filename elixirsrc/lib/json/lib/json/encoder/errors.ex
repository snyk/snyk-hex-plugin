defmodule Snyk.JSON.Decoder.Error do
  @moduledoc """
  Thrown when an unknown decoder error happens
  """
  defexception message: "Invalid Snyk.JSON - unknown error"
end

defmodule Snyk.JSON.Decoder.UnexpectedEndOfBufferError do
  @moduledoc """
  Thrown when the json payload is incomplete
  """
  defexception message: "Invalid Snyk.JSON - unexpected end of buffer"
end

defmodule Snyk.JSON.Decoder.UnexpectedTokenError do
  @moduledoc """
  Thrown when the json payload is invalid
  """
  defexception token: nil

  @doc """
    Invalid Snyk.JSON - Unexpected token
  """
  def message(exception), do: "Invalid Snyk.JSON - unexpected token >>#{exception.token}<<"
end

defmodule Snyk.JSON.Encoder.Error do
  @moduledoc """
  Thrown when an encoder error happens
  """
  defexception error_info: nil

  @doc """
    Invalid Term
  """
  def message(exception) do
    error_message = "An error occurred while encoding the Snyk.JSON object"

    if nil != exception.error_info do
      error_message <> " >>#{exception.error_info}<<"
    else
      error_message
    end
  end
end
