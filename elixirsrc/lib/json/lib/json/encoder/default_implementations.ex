defimpl Snyk.JSON.Encoder, for: Tuple do
  @doc """
  Encodes an Elixir tuple into a Snyk.JSON array
  """
  def encode(term), do: term |> Tuple.to_list() |> Snyk.JSON.Encoder.Helpers.enum_encode()

  @doc """
  Returns an atom that represents the Snyk.JSON type for the term
  """
  def typeof(_), do: :array
end

defimpl Snyk.JSON.Encoder, for: HashDict do
  @doc """
  Encodes an Elixir HashDict into a Snyk.JSON object
  """
  def encode(dict), do: Snyk.JSON.Encoder.Helpers.dict_encode(dict)

  @doc """
  Returns :object
  """
  def typeof(_), do: :object
end

defimpl Snyk.JSON.Encoder, for: List do
  @doc """
  Encodes an Elixir List into a Snyk.JSON array
  """
  def encode([]), do: {:ok, "[]"}

  def encode(list) do
    if Keyword.keyword?(list) do
      Snyk.JSON.Encoder.Helpers.dict_encode(list)
    else
      Snyk.JSON.Encoder.Helpers.enum_encode(list)
    end
  end

  @doc """
  Returns an atom that represents the Snyk.JSON type for the term
  """
  def typeof([]), do: :array

  def typeof(list) do
    if Keyword.keyword?(list) do
      :object
    else
      :array
    end
  end
end

defimpl Snyk.JSON.Encoder, for: [Integer, Float] do
  @doc """
  Converts Elixir Integer and Floats into Snyk.JSON Numbers
  """
  # Elixir converts octal, etc into decimal when putting in strings
  def encode(number), do: {:ok, "#{number}"}

  @doc """
  Returns an atom that represents the Snyk.JSON type for the term
  """
  def typeof(_), do: :number
end

defimpl Snyk.JSON.Encoder, for: Atom do
  @doc """
  Converts Elixir Atoms into their Snyk.JSON equivalents
  """
  def encode(nil), do: {:ok, "null"}
  def encode(false), do: {:ok, "false"}
  def encode(true), do: {:ok, "true"}
  def encode(atom) when is_atom(atom), do: atom |> Atom.to_string() |> Snyk.JSON.Encoder.encode()

  @doc """
  Returns an atom that represents the Snyk.JSON type for the term
  """
  def typeof(boolean) when is_boolean(boolean), do: :boolean
  def typeof(nil), do: :null
  def typeof(atom) when is_atom(atom), do: :string
end

defimpl Snyk.JSON.Encoder, for: BitString do
  # 32 = ascii space, cleaner than using "? ", I think
  @acii_space 32

  @doc """
  Converts Elixir String into Snyk.JSON String
  """
  def encode(bitstring), do: {:ok, <<?">> <> encode_binary_recursive(bitstring, []) <> <<?">>}

  defp encode_binary_recursive(<<head::utf8, tail::binary>>, acc) do
    encode_binary_recursive(tail, encode_binary_character(head, acc))
  end

  # stop cond
  defp encode_binary_recursive(<<>>, acc), do: acc |> Enum.reverse() |> to_string

  defp encode_binary_character(?", acc), do: [?", ?\\ | acc]
  defp encode_binary_character(?\b, acc), do: [?b, ?\\ | acc]
  defp encode_binary_character(?\f, acc), do: [?f, ?\\ | acc]
  defp encode_binary_character(?\n, acc), do: [?n, ?\\ | acc]
  defp encode_binary_character(?\r, acc), do: [?r, ?\\ | acc]
  defp encode_binary_character(?\t, acc), do: [?t, ?\\ | acc]
  defp encode_binary_character(?\\, acc), do: [?\\, ?\\ | acc]

  defp encode_binary_character(char, acc) when is_number(char) and char < @acii_space do
    encode_hexadecimal_unicode_control_character(char, [?u, ?\\ | acc])
  end

  # anything else besides these control characters, just let it through
  defp encode_binary_character(char, acc) when is_number(char), do: [char | acc]

  defp encode_hexadecimal_unicode_control_character(char, acc) when is_number(char) do
    [
      char
      |> Integer.to_charlist(16)
      |> zeropad_hexadecimal_unicode_control_character
      |> Enum.reverse()
      | acc
    ]
  end

  defp zeropad_hexadecimal_unicode_control_character([a, b, c]), do: [?0, a, b, c]
  defp zeropad_hexadecimal_unicode_control_character([a, b]), do: [?0, ?0, a, b]
  defp zeropad_hexadecimal_unicode_control_character([a]), do: [?0, ?0, ?0, a]
  defp zeropad_hexadecimal_unicode_control_character(iolist) when is_list(iolist), do: iolist

  @doc """
  Returns an atom that represents the Snyk.JSON type for the term
  """
  def typeof(_), do: :string
end

defimpl Snyk.JSON.Encoder, for: Record do
  @doc """
  Encodes elixir records into json objects
  """
  def encode(record), do: record.to_keywords |> Snyk.JSON.Encoder.Helpers.dict_encode()

  @doc """
  Encodes a record into a Snyk.JSON object
  """
  def typeof(_), do: :object
end

defimpl Snyk.JSON.Encoder, for: Map do
  @doc """
  Encodes maps into object
  """
  def encode(map), do: map |> Snyk.JSON.Encoder.Helpers.dict_encode()

  @doc """
  Returns an atom that represents the Snyk.JSON type for the term
  """
  def typeof(_), do: :object
end

defimpl Snyk.JSON.Encoder, for: Any do
  @moduledoc """
  Falllback module for encoding any other values
  """

  @doc """
  Encodes a map into a Snyk.JSON object
  """
  def encode(%{} = struct) do
    struct
    |> Map.to_list()
    |> Snyk.JSON.Encoder.Helpers.dict_encode()
  end

  def encode(x) do
    x
    |> Kernel.inspect()
    |> Snyk.JSON.Encoder.encode()
  end

  @doc """
  Fallback method
  """
  def typeof(struct) when is_map(struct), do: :object
  def typeof(_), do: :string
end
