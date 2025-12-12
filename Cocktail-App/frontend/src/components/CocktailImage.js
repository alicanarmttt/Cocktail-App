import React, { useState, useEffect } from "react";
import { Image } from "react-native";
import DEFAULT_IMAGE from "../../assets/default_cocktail.png";

const CocktailImage = ({ uri, style, resizeMode = "cover" }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [uri]);

  if (!uri || uri.trim() === "") {
    // URL yoksa Default resim, SENİN VERDİĞİN STYLE ile gösterilir
    return (
      <Image source={DEFAULT_IMAGE} style={style} resizeMode={resizeMode} />
    );
  }

  return (
    <Image
      source={error ? DEFAULT_IMAGE : { uri: uri }}
      style={style} // <--- İŞTE BURASI: Dışarıdan gelen stil buraya uygulanır
      resizeMode={resizeMode}
      onError={() => setError(true)}
      defaultSource={DEFAULT_IMAGE}
    />
  );
};

export default CocktailImage;
