defprotocol Snyk.JSON.Encoder do
  @fallback_to_any true

  @moduledoc """
  Defines the protocol required for converting Elixir types into Snyk.JSON and inferring their json types.
  """

  @doc """
  Returns a Snyk.JSON string representation of the Elixir term

  ## Examples
      iex> Snyk.JSON.Encoder.encode({1, :two, "three"})
      {:ok, "[1,\\\"two\\\",\\\"three\\\"]"}

      iex> Snyk.JSON.Encoder.encode([result: "this will be a elixir result"])
      {:ok, "{\\\"result\\\":\\\"this will be a elixir result\\\"}"}

      iex> Snyk.JSON.Encoder.encode(%{a: 1, b: 2})
      {:ok, "{\\\"a\\\":1,\\\"b\\\":2}"}
  """
  @spec encode(tuple | HashDict.t() | list | integer | float | map | list | atom | term) ::
          {atom, bitstring}
  def encode(term)

  @doc """
  Returns an atom that reprsents the Snyk.JSON type for the term

  ## Examples
      iex> Snyk.JSON.Encoder.typeof(3)
      :number

      iex> Snyk.JSON.Encoder.typeof({1, :two, "three"})
      :array

      iex> Snyk.JSON.Encoder.typeof([foo: "this will be a elixir result"])
      :object

      iex> Snyk.JSON.Encoder.typeof([result: "this will be a elixir result"])
      :object

      iex> Snyk.JSON.Encoder.typeof(["this will be a elixir result"])
      :array

      iex> Snyk.JSON.Encoder.typeof([foo: "bar"])
      :object
  """
  @spec typeof(term) :: atom
  def typeof(term)
end
