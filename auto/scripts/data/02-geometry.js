const RAW_GEOMETRY_MODULES = [
  {
    "id": "dnb_15",
    "num": 15,
    "title": "Repère orthogonal — lire des coordonnées",
    "level_tags": [
      "4e",
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "Lis les coordonnées du point M :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${cx}\" cy=\"${cy}\" r=\"5\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"${cy}\" dx=\"10\" dy=\"-7\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#c0392b\">M</text>\n</svg>",
        "answer": "[\"x\",\"y\"]",
        "options": {
          "formula_code": "setNB(1)\nx=RD(1,3)\ny=RD(1,3)\ncx=200+x*40\ncy=200-y*40"
        },
        "footer": "$$M(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
      },
      {
        "n": 2,
        "statement": "Lis les coordonnées du point M :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${cx}\" cy=\"${cy}\" r=\"5\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"${cy}\" dx=\"10\" dy=\"-7\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#c0392b\">M</text>\n</svg>",
        "answer": "[\"x\",\"y\"]",
        "options": {
          "formula_code": "setNB(1)\nx=RD(-3,-1)\ny=RD(1,3)\ncx=200+x*40\ncy=200-y*40"
        },
        "footer": "$$M(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
      },
      {
        "n": 3,
        "statement": "Lis les coordonnées du point M (il est sur un axe) :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${cx}\" cy=\"${cy}\" r=\"5\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"${cy}\" dx=\"10\" dy=\"-7\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#c0392b\">M</text>\n</svg>",
        "answer": "[\"x\",\"y\"]",
        "options": {
          "formula_code": "setNB(1)\nx=RD(-3,3,[0])\ny=0\ncx=200+x*40\ncy=200-y*40"
        },
        "footer": "$$M(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
      },
      {
        "n": 4,
        "statement": "Lis les coordonnées du point M :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${cx}\" cy=\"${cy}\" r=\"5\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"${cy}\" dx=\"10\" dy=\"-7\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#c0392b\">M</text>\n</svg>",
        "answer": "[\"x\",\"y\"]",
        "options": {
          "formula_code": "setNB(1)\nx=RD(-3,-1)\ny=RD(-3,-1)\ncx=200+x*40\ncy=200-y*40"
        },
        "footer": "$$M(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
      },
      {
        "n": 5,
        "statement": "Lis les coordonnées des points M et N :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${cxM}\" cy=\"${cyM}\" r=\"5\" fill=\"#c0392b\"/>\n<text x=\"${cxM}\" y=\"${cyM}\" dx=\"10\" dy=\"-7\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#c0392b\">M</text>\n<circle cx=\"${cxN}\" cy=\"${cyN}\" r=\"5\" fill=\"#2471a3\"/>\n<text x=\"${cxN}\" y=\"${cyN}\" dx=\"10\" dy=\"-7\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#2471a3\">N</text>\n</svg>",
        "answer": "[\"xM\",\"yM\",\"xN\",\"yN\"]",
        "options": {
          "formula_code": "setNB(1)\nxM=RD(-3,-1)\nyM=RD(1,3)\nxN=RD(1,3)\nyN=RD(-3,-1)\ncxM=200+xM*40\ncyM=200-yM*40\ncxN=200+xN*40\ncyN=200-yN*40"
        },
        "footer": "$$M(\\,[[formula]]\\,;\\,[[formula]]\\,) \\qquad N(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
      },
      {
        "n": 6,
        "statement": "Lis les coordonnées du point M (attention aux demi-unités) :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#eee\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"60\" x2=\"360\" y2=\"60\"/>\n<line x1=\"40\" y1=\"100\" x2=\"360\" y2=\"100\"/>\n<line x1=\"40\" y1=\"140\" x2=\"360\" y2=\"140\"/>\n<line x1=\"40\" y1=\"180\" x2=\"360\" y2=\"180\"/>\n<line x1=\"40\" y1=\"220\" x2=\"360\" y2=\"220\"/>\n<line x1=\"40\" y1=\"260\" x2=\"360\" y2=\"260\"/>\n<line x1=\"40\" y1=\"300\" x2=\"360\" y2=\"300\"/>\n<line x1=\"40\" y1=\"340\" x2=\"360\" y2=\"340\"/>\n<line x1=\"60\" y1=\"40\" x2=\"60\" y2=\"360\"/>\n<line x1=\"100\" y1=\"40\" x2=\"100\" y2=\"360\"/>\n<line x1=\"140\" y1=\"40\" x2=\"140\" y2=\"360\"/>\n<line x1=\"180\" y1=\"40\" x2=\"180\" y2=\"360\"/>\n<line x1=\"220\" y1=\"40\" x2=\"220\" y2=\"360\"/>\n<line x1=\"260\" y1=\"40\" x2=\"260\" y2=\"360\"/>\n<line x1=\"300\" y1=\"40\" x2=\"300\" y2=\"360\"/>\n<line x1=\"340\" y1=\"40\" x2=\"340\" y2=\"360\"/>\n</g>\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${cx}\" cy=\"${cy}\" r=\"5\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"${cy}\" dx=\"10\" dy=\"-7\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#c0392b\">M</text>\n</svg>",
        "answer": "[\"x\",\"y\"]",
        "options": {
          "formula_code": "setNB(2)\nix=RD(1,5)\niy=RD(1,5)\nx=CUT(ix*0.5,1)\ny=CUT(iy*0.5,1)\ncx=200+ix*20\ncy=200-iy*20"
        },
        "footer": "$$M(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
      },
      {
        "n": 7,
        "statement": "Quelle est l'abscisse du point M ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${cx}\" cy=\"${cy}\" r=\"5\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"${cy}\" dx=\"10\" dy=\"-7\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#c0392b\">M</text>\n</svg>",
        "answer": "[\"x\"]",
        "options": {
          "formula_code": "setNB(1)\nx=RD(-3,3,[0])\ny=RD(-3,3,[0])\ncx=200+x*40\ncy=200-y*40"
        },
        "footer": "$$x_M=[[formula]]$$"
      },
      {
        "n": 8,
        "statement": "Quelle est l'ordonnée du point M ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${cx}\" cy=\"${cy}\" r=\"5\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"${cy}\" dx=\"10\" dy=\"-7\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#c0392b\">M</text>\n</svg>",
        "answer": "[\"y\"]",
        "options": {
          "formula_code": "setNB(1)\nx=RD(-3,3,[0])\ny=RD(-3,3,[0])\ncx=200+x*40\ncy=200-y*40"
        },
        "footer": "$$y_M=[[formula]]$$"
      },
      {
        "n": 9,
        "statement": "Quelles sont les coordonnées du point M ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${cx}\" cy=\"${cy}\" r=\"5\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"${cy}\" dx=\"10\" dy=\"-7\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#c0392b\">M</text>\n</svg>&&$$(${x}\\,;\\,${y})$$&&$$(${y}\\,;\\,${x})$$&&$$(${x}\\,;\\,${oppy})$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nx=RD(1,3)\ny=RD(-3,-1)\noppy=0-y\ncx=200+x*40\ncy=200-y*40",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      }
    ]
  },
  {
    "id": "dnb_16",
    "num": 16,
    "title": "Codage d'une figure — triangles, quadrilatères, médiatrice",
    "level_tags": [
      "4e",
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "<div style=\"text-align:center\">Quelle est la nature de ce triangle (observe le codage) ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 260\" style=\"max-width:300px\">\n<polygon points=\"150,50 60,170 240,170\" fill=\"#eef5ff\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"101.8\" y1=\"107.6\" x2=\"108.2\" y2=\"112.4\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"191.8\" y1=\"112.4\" x2=\"198.2\" y2=\"107.6\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n</svg>&&Triangle isocèle&&Triangle équilatéral&&Triangle quelconque&&Triangle rectangle&&</div>",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 2,
        "statement": "<div style=\"text-align:center\">Quelle est la nature de ce triangle ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 260\" style=\"max-width:300px\">\n<polygon points=\"150.0,55.0 70.0,193.6 230.0,193.6\" fill=\"#eef5ff\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"106.5\" y1=\"122.3\" x2=\"113.5\" y2=\"126.3\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"186.5\" y1=\"126.3\" x2=\"193.5\" y2=\"122.3\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"150.0\" y1=\"197.6\" x2=\"150.0\" y2=\"189.6\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n</svg>&&Triangle équilatéral&&Triangle isocèle non équilatéral&&Triangle rectangle&&Triangle quelconque&&</div>",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 3,
        "statement": "<div style=\"text-align:center\">Quelle est la nature de ce triangle ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 260\" style=\"max-width:300px\">\n<polygon points=\"70,60 70,200 240,200\" fill=\"#eef5ff\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polyline points=\"70.0,188.0 82.0,188.0 82.0,200.0\" fill=\"none\" stroke=\"#222\" stroke-width=\"1.5\"/>\n</svg>&&Triangle rectangle&&Triangle isocèle&&Triangle équilatéral&&Triangle quelconque&&</div>",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 4,
        "statement": "<div style=\"text-align:center\">Quelle est la nature de ce quadrilatère ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 260\" style=\"max-width:300px\">\n<polygon points=\"90,60 210,60 210,180 90,180\" fill=\"#eef5ff\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polyline points=\"102.0,60.0 102.0,72.0 90.0,72.0\" fill=\"none\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polyline points=\"198.0,60.0 198.0,72.0 210.0,72.0\" fill=\"none\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"150.0\" y1=\"64.0\" x2=\"150.0\" y2=\"56.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"206.0\" y1=\"120.0\" x2=\"214.0\" y2=\"120.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"150.0\" y1=\"176.0\" x2=\"150.0\" y2=\"184.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"94.0\" y1=\"120.0\" x2=\"86.0\" y2=\"120.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n</svg>&&Un carré&&Un losange non carré&&Un rectangle non carré&&Un parallélogramme quelconque&&</div>",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 5,
        "statement": "<div style=\"text-align:center\">Quelle est la nature de ce quadrilatère ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 260\" style=\"max-width:300px\">\n<polygon points=\"70,75 230,75 230,165 70,165\" fill=\"#eef5ff\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polyline points=\"82.0,75.0 82.0,87.0 70.0,87.0\" fill=\"none\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polyline points=\"218.0,75.0 218.0,87.0 230.0,87.0\" fill=\"none\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polyline points=\"230.0,153.0 218.0,153.0 218.0,165.0\" fill=\"none\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polyline points=\"70.0,153.0 82.0,153.0 82.0,165.0\" fill=\"none\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"148.0\" y1=\"79.0\" x2=\"148.0\" y2=\"71.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"152.0\" y1=\"79.0\" x2=\"152.0\" y2=\"71.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"152.0\" y1=\"161.0\" x2=\"152.0\" y2=\"169.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"148.0\" y1=\"161.0\" x2=\"148.0\" y2=\"169.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"226.0\" y1=\"120.0\" x2=\"234.0\" y2=\"120.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"74.0\" y1=\"120.0\" x2=\"66.0\" y2=\"120.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n</svg>&&Un rectangle&&Un carré&&Un losange&&Un trapèze&&</div>",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 6,
        "statement": "<div style=\"text-align:center\">Quelle est la nature de ce quadrilatère ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 260\" style=\"max-width:300px\">\n<polygon points=\"150,95 230,150 150,205 70,150\" fill=\"#eef5ff\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"187.7\" y1=\"125.8\" x2=\"192.3\" y2=\"119.2\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"187.7\" y1=\"174.2\" x2=\"192.3\" y2=\"180.8\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"112.3\" y1=\"174.2\" x2=\"107.7\" y2=\"180.8\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"112.3\" y1=\"125.8\" x2=\"107.7\" y2=\"119.2\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n</svg>&&Un losange&&Un carré&&Un rectangle&&Un trapèze&&</div>",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 7,
        "statement": "<div style=\"text-align:center\">Quelle est la nature de ce quadrilatère (observe les marques de parallélisme) ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 260\" style=\"max-width:300px\">\n<polygon points=\"70,70 210,70 250,180 110,180\" fill=\"#eef5ff\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polyline points=\"134.0,76.0 146.0,70.0 134.0,64.0\" fill=\"none\" stroke=\"#2471a3\" stroke-width=\"1.5\"/>\n<polyline points=\"174.0,186.0 186.0,180.0 174.0,174.0\" fill=\"none\" stroke=\"#2471a3\" stroke-width=\"1.5\"/>\n<polyline points=\"221.5,119.1 231.2,128.3 232.7,115.0\" fill=\"none\" stroke=\"#27ae60\" stroke-width=\"1.5\"/>\n<polyline points=\"223.2,123.8 232.9,133.0 234.4,119.7\" fill=\"none\" stroke=\"#27ae60\" stroke-width=\"1.5\"/>\n<polyline points=\"81.5,119.1 91.2,128.3 92.7,115.0\" fill=\"none\" stroke=\"#27ae60\" stroke-width=\"1.5\"/>\n<polyline points=\"83.2,123.8 92.9,133.0 94.4,119.7\" fill=\"none\" stroke=\"#27ae60\" stroke-width=\"1.5\"/>\n</svg>&&Un parallélogramme&&Un rectangle&&Un losange&&Un carré&&</div>",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 8,
        "statement": "<div style=\"text-align:center\">La droite rouge est…\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 260\" style=\"max-width:300px\">\n<line x1=\"60\" y1=\"170\" x2=\"260\" y2=\"170\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<circle cx=\"60\" cy=\"170\" r=\"3\" fill=\"#222\"/><circle cx=\"260\" cy=\"170\" r=\"3\" fill=\"#222\"/>\n<text x=\"48\" y=\"175\" font-family=\"serif\" font-style=\"italic\" font-size=\"16\">A</text>\n<text x=\"265\" y=\"175\" font-family=\"serif\" font-style=\"italic\" font-size=\"16\">B</text>\n<line x1=\"160.0\" y1=\"80\" x2=\"160.0\" y2=\"240\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<polyline points=\"160.0,182.0 172.0,182.0 172.0,170.0\" fill=\"none\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"110.0\" y1=\"174.0\" x2=\"110.0\" y2=\"166.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"210.0\" y1=\"174.0\" x2=\"210.0\" y2=\"166.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n</svg>&&la médiatrice du segment [AB]&&une diagonale&&la bissectrice d'un angle&&une parallèle à [AB]&&</div>",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 9,
        "statement": "<div style=\"text-align:center\">D'après le codage, pourquoi ce triangle est-il isocèle ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 260\" style=\"max-width:300px\">\n<polygon points=\"150,50 60,170 240,170\" fill=\"#eef5ff\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"101.8\" y1=\"107.6\" x2=\"108.2\" y2=\"112.4\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"191.8\" y1=\"112.4\" x2=\"198.2\" y2=\"107.6\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n</svg>&&Il a deux côtés de même longueur&&Il a un angle droit&&Il a trois côtés égaux&&Ses trois angles sont égaux&&</div>",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 10,
        "statement": "<div style=\"text-align:center\">Que peut-on dire des deux parties du segment [AB] de part et d'autre de la droite rouge ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 260\" style=\"max-width:300px\">\n<line x1=\"60\" y1=\"170\" x2=\"260\" y2=\"170\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<circle cx=\"60\" cy=\"170\" r=\"3\" fill=\"#222\"/><circle cx=\"260\" cy=\"170\" r=\"3\" fill=\"#222\"/>\n<text x=\"48\" y=\"175\" font-family=\"serif\" font-style=\"italic\" font-size=\"16\">A</text>\n<text x=\"265\" y=\"175\" font-family=\"serif\" font-style=\"italic\" font-size=\"16\">B</text>\n<line x1=\"160.0\" y1=\"80\" x2=\"160.0\" y2=\"240\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<polyline points=\"160.0,182.0 172.0,182.0 172.0,170.0\" fill=\"none\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"110.0\" y1=\"174.0\" x2=\"110.0\" y2=\"166.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n<line x1=\"210.0\" y1=\"174.0\" x2=\"210.0\" y2=\"166.0\" stroke=\"#c0392b\" stroke-width=\"1.5\"/>\n</svg>&&Elles ont la même longueur&&L'une est double de l'autre&&Elles sont perpendiculaires&&On ne peut rien dire&&</div>",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      }
    ]
  },
  {
    "id": "dnb_17",
    "num": 17,
    "title": "Angles — reconnaître, citer, mesurer",
    "level_tags": [
      "4e",
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "Quelle est la nature de cet angle ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"340\" height=\"auto\" viewBox=\"0 0 340 260\" style=\"max-width:340px\">\n<line x1=\"120\" y1=\"200\" x2=\"260\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"120\" y1=\"200\" x2=\"${ex}\" y2=\"${ey}\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<path d=\"M 155,200 A 35,35 0 0 0 ${ax},${ay}\" fill=\"none\" stroke=\"#c0392b\" stroke-width=\"2\"/>\n<circle cx=\"120\" cy=\"200\" r=\"3\" fill=\"#222\"/>\n<text x=\"105\" y=\"218\" font-family=\"serif\" font-style=\"italic\" font-size=\"18\">O</text>\n</svg>&&Un angle aigu&&Un angle obtus&&Un angle droit&&Un angle plat&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nang=RD(20,80)\nrad=ang*pi/180\nex=floor(120+140*cos(rad)+0.5)\ney=floor(200-140*sin(rad)+0.5)\nax=floor(120+35*cos(rad)+0.5)\nay=floor(200-35*sin(rad)+0.5)",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 2,
        "statement": "Quelle est la nature de cet angle ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"340\" height=\"auto\" viewBox=\"0 0 340 260\" style=\"max-width:340px\">\n<line x1=\"120\" y1=\"200\" x2=\"260\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"120\" y1=\"200\" x2=\"${ex}\" y2=\"${ey}\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<path d=\"M 155,200 A 35,35 0 0 0 ${ax},${ay}\" fill=\"none\" stroke=\"#c0392b\" stroke-width=\"2\"/>\n<circle cx=\"120\" cy=\"200\" r=\"3\" fill=\"#222\"/>\n<text x=\"105\" y=\"218\" font-family=\"serif\" font-style=\"italic\" font-size=\"18\">O</text>\n</svg>&&Un angle obtus&&Un angle aigu&&Un angle droit&&Un angle nul&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nang=RD(100,160)\nrad=ang*pi/180\nex=floor(120+140*cos(rad)+0.5)\ney=floor(200-140*sin(rad)+0.5)\nax=floor(120+35*cos(rad)+0.5)\nay=floor(200-35*sin(rad)+0.5)",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 3,
        "statement": "Combien mesure un angle droit ?",
        "answer": "[\"90\"]",
        "options": null,
        "footer": "$$[[int]]°$$"
      },
      {
        "n": 4,
        "statement": "Combien mesure un angle plat ?",
        "answer": "[\"180\"]",
        "options": null,
        "footer": "$$[[int]]°$$"
      },
      {
        "n": 5,
        "statement": "Les angles 1 et 2 (formés par deux droites sécantes) sont…\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"340\" height=\"auto\" viewBox=\"0 0 340 260\" style=\"max-width:340px\">\n<line x1=\"278.8\" y1=\"79.3\" x2=\"61.2\" y2=\"180.7\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"129.0\" y1=\"17.2\" x2=\"211.0\" y2=\"242.8\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<circle cx=\"170\" cy=\"130\" r=\"3\" fill=\"#222\"/>\n<text x=\"174\" y=\"48\" font-family=\"sans-serif\" font-size=\"18\" fill=\"#c0392b\">1</text>\n<text x=\"151\" y=\"212\" font-family=\"sans-serif\" font-size=\"18\" fill=\"#2471a3\">2</text>\n</svg>&&opposés par le sommet&&adjacents&&complémentaires&&supplémentaires&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 6,
        "statement": "Les angles 1 et 2 ont le même sommet et un côté commun. Ils sont…\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"340\" height=\"auto\" viewBox=\"0 0 340 260\" style=\"max-width:340px\">\n<line x1=\"120\" y1=\"200\" x2=\"260.0\" y2=\"200.0\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"120\" y1=\"200\" x2=\"200.3\" y2=\"85.3\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"120\" y1=\"200\" x2=\"72.1\" y2=\"68.4\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<circle cx=\"120\" cy=\"200\" r=\"3\" fill=\"#222\"/>\n<text x=\"191\" y=\"164\" font-family=\"sans-serif\" font-size=\"16\" fill=\"#c0392b\">1</text>\n<text x=\"131\" y=\"121\" font-family=\"sans-serif\" font-size=\"16\" fill=\"#2471a3\">2</text>\n</svg>&&adjacents&&opposés par le sommet&&alternes-internes&&complémentaires&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 7,
        "statement": "Deux angles dont supplémentaires. Si l'un mesure $$${a}°$$, combien mesure l'autre ?",
        "answer": "[\"180-a\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(30,150)"
        },
        "footer": "$$[[formula]]°$$"
      },
      {
        "n": 8,
        "statement": "Deux angles sont complémentaires. Si l'un mesure $$${a}°$$, combien mesure l'autre ?",
        "answer": "[\"90-a\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(10,80)"
        },
        "footer": "$$[[formula]]°$$"
      },
      {
        "n": 9,
        "statement": "Un angle qui mesure $$${a}°$$ est…&&un angle aigu&&un angle obtus&&un angle droit&&un angle plat&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(10,85)",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 10,
        "statement": "Les angles $$\\widehat{AOB}$$ et $$\\widehat{BOC}$$ sont adjacents et forment un angle plat. Si $$\\widehat{AOB}=${a}°$$, combien mesure $$\\widehat{BOC}$$ ?",
        "answer": "[\"180-a\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(30,150)"
        },
        "footer": "$$\\widehat{BOC}=[[formula]]°$$"
      }
    ]
  },
  {
    "id": "dnb_18",
    "num": 18,
    "title": "Somme des angles d'un triangle",
    "level_tags": [
      "4e",
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "Quelle est la somme des mesures des angles d'un triangle ?",
        "answer": "[\"180\"]",
        "options": null,
        "footer": "$$[[int]]°$$"
      },
      {
        "n": 2,
        "statement": "Dans un triangle, deux angles mesurent $$${a}°$$ et $$${b}°$$. Combien mesure le troisième ?",
        "answer": "[\"180-a-b\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(40,80)\nb=RD(40,80)"
        },
        "footer": "$$[[formula]]°$$"
      },
      {
        "n": 3,
        "statement": "Dans un triangle, deux angles mesurent $$${a}°$$ et $$${b}°$$. Calcule la mesure du troisième angle.",
        "answer": "[\"180-a-b\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(20,60)\nb=RD(30,70)"
        },
        "footer": "$$[[formula]]°$$"
      },
      {
        "n": 4,
        "statement": "Un triangle rectangle a un angle droit. Un autre angle mesure $$${a}°$$. Combien mesure le troisième ?",
        "answer": "[\"90-a\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(20,70)"
        },
        "footer": "$$[[formula]]°$$"
      },
      {
        "n": 5,
        "statement": "Un triangle isocèle a son angle principal (au sommet) qui mesure $$${a}°$$. Combien mesure chacun des deux angles égaux à la base ?",
        "answer": "[\"(180-a)/2\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(10,80)*2"
        },
        "footer": "$$[[formula]]°$$"
      },
      {
        "n": 6,
        "statement": "Un triangle isocèle a ses deux angles à la base qui mesurent chacun $$${a}°$$. Combien mesure l'angle au sommet ?",
        "answer": "[\"180-2*a\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(40,80)"
        },
        "footer": "$$[[formula]]°$$"
      },
      {
        "n": 7,
        "statement": "Combien mesure chaque angle d'un triangle équilatéral ?",
        "answer": "[\"60\"]",
        "options": null,
        "footer": "$$[[int]]°$$"
      },
      {
        "n": 8,
        "statement": "Ces trois angles peuvent-ils être ceux d'un même triangle : $$${a}°$$, $$${b}°$$ et $$${c}°$$ ?&&Oui&&Non&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(40,80)\nb=RD(40,80)\nc=180-a-b",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 9,
        "statement": "Lis les deux angles donnés et calcule la mesure de l'angle $$\\widehat{C}$$ (en rouge) :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"340\" height=\"auto\" viewBox=\"0 0 340 280\" style=\"max-width:340px\">\n<polygon points=\"80,230 260,230 ${xC},${yC}\" fill=\"#eef5ff\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<path d=\"M 106,230 A 26,26 0 0,0 ${ax2x},${ax2y}\" fill=\"none\" stroke=\"#2471a3\" stroke-width=\"1.5\"/>\n<path d=\"M ${bx1},${by1} A 26,26 0 0,0 234,230\" fill=\"none\" stroke=\"#27ae60\" stroke-width=\"1.5\"/>\n<path d=\"M ${cx1},${cy1} A 24,24 0 0,0 ${cx2},${cy2}\" fill=\"none\" stroke=\"#c0392b\" stroke-width=\"2\"/>\n<text x=\"${laxx}\" y=\"${layy}\" font-family=\"sans-serif\" font-size=\"14\" fill=\"#2471a3\" text-anchor=\"middle\">${a}°</text>\n<text x=\"${lbxx}\" y=\"${lbyy}\" font-family=\"sans-serif\" font-size=\"14\" fill=\"#27ae60\" text-anchor=\"middle\">${b}°</text>\n<text x=\"62\" y=\"235\" font-family=\"serif\" font-style=\"italic\" font-size=\"16\">A</text>\n<text x=\"266\" y=\"235\" font-family=\"serif\" font-style=\"italic\" font-size=\"16\">B</text>\n<text x=\"${xC}\" y=\"${yC}\" dx=\"-4\" dy=\"-8\" font-family=\"serif\" font-style=\"italic\" font-size=\"16\">C</text>\n</svg>",
        "answer": "[\"c\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(50,70)\nb=RD(50,70)\nc=180-a-b\nra=a*pi/180\nrb=b*pi/180\nrg=c*pi/180\nxA=80\nyA=230\nxB=260\nAB=180\nAC=AB*sin(rb)/sin(rg)\nxC=floor(80+AC*cos(ra)+0.5)\nyC=floor(230-AC*sin(ra)+0.5)\nax2x=floor(80+26*cos(ra)+0.5)\nax2y=floor(230-26*sin(ra)+0.5)\nangBC=atan2(yC-230,xC-260)\nbx1=floor(260+26*cos(angBC)+0.5)\nby1=floor(230+26*sin(angBC)+0.5)\nangCA=atan2(230-yC,80-xC)\nangCB=atan2(230-yC,260-xC)\ncx1=floor(xC+24*cos(angCA)+0.5)\ncy1=floor(yC+24*sin(angCA)+0.5)\ncx2=floor(xC+24*cos(angCB)+0.5)\ncy2=floor(yC+24*sin(angCB)+0.5)\nlaxx=floor(80+46*cos(ra/2)+0.5)\nlayy=floor(230-46*sin(ra/2)+0.5)\nubcx=cos(angBC)\nubcy=sin(angBC)\nsumx=ubcx-1\nsumy=ubcy\nnrm=sqrt(sumx*sumx+sumy*sumy)\nlbxx=floor(260+46*sumx/nrm+0.5)\nlbyy=floor(230+46*sumy/nrm+0.5)"
        },
        "footer": "$$\\widehat{C}=[[formula]]°$$"
      },
      {
        "n": 10,
        "statement": "Un élève affirme qu'un triangle a deux angles mesurant $$${a}°$$ et $$${b}°$$. A-t-il raison ?&&Non, c'est impossible&&Oui, c'est possible&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(100,140)\nm=RD(5,30)\nb=180-a+m+10",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      }
    ]
  },
  {
    "id": "dnb_19",
    "num": 19,
    "title": "Conversions d'unités",
    "level_tags": [
      "4e",
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": false,
    "questions": [
      {
        "n": 1,
        "statement": "",
        "answer": "[\"n/100\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(1,9)*100+RD(0,9)*10"
        },
        "footer": "$$${n}\\,\\text{cm}=[[formula]]\\,\\text{m}$$"
      },
      {
        "n": 2,
        "statement": "",
        "answer": "[\"n*1000+d*100\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(1,9)\nd=RD(1,9)"
        },
        "footer": "$$${n},${d}\\,\\text{km}=[[formula]]\\,\\text{m}$$"
      },
      {
        "n": 3,
        "statement": "",
        "answer": "[\"n\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(2,9)\nc=n*10000"
        },
        "footer": "$$${c}\\,\\text{cm}^2=[[formula]]\\,\\text{m}^2$$"
      },
      {
        "n": 4,
        "statement": "",
        "answer": "[\"n*10000\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(2,9)"
        },
        "footer": "$$${n}\\,\\text{m}^2=[[formula]]\\,\\text{cm}^2$$"
      },
      {
        "n": 5,
        "statement": "Sachant que $$1\\,\\text{dm}^3=1\\,\\text{L}$$, convertis en litres :",
        "answer": "[\"n\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(2,9)\nc=n*1000"
        },
        "footer": "$$${c}\\,\\text{cm}^3=[[formula]]\\,\\text{L}$$"
      },
      {
        "n": 6,
        "statement": "",
        "answer": "[\"n*1000+d*100\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(1,9)\nd=RD(1,9)"
        },
        "footer": "$$${n},${d}\\,\\text{kg}=[[formula]]\\,\\text{g}$$"
      },
      {
        "n": 7,
        "statement": "",
        "answer": "[\"n/100\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(1,9)*100+RD(1,9)*10"
        },
        "footer": "$$${n}\\,\\text{cL}=[[formula]]\\,\\text{L}$$"
      },
      {
        "n": 8,
        "statement": "",
        "answer": "[\"h*3600+m*60\"]",
        "options": {
          "formula_code": "setNB(1)\nh=RD(1,5)\nm=RD(1,9)*5"
        },
        "footer": "$$${h}\\,\\text{h}\\,${m}\\,\\text{min}=[[formula]]\\,\\text{s}$$"
      },
      {
        "n": 9,
        "statement": "",
        "answer": "[\"1000\",\"n\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(2,9)"
        },
        "footer": "$$1\\,\\text{m}^3=[[formula]]\\,\\text{L}$$\n\n$$${n}\\,\\text{dm}^3=[[formula]]\\,\\text{L}$$"
      },
      {
        "n": 10,
        "statement": "",
        "answer": "[\"n*100000\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(1,5)"
        },
        "footer": "$$${n}\\,\\text{km}=[[formula]]\\,\\text{cm}$$"
      }
    ]
  },
  {
    "id": "dnb_20",
    "num": 20,
    "title": "Reconnaître des solides",
    "level_tags": [
      "4e",
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"260\" height=\"auto\" viewBox=\"0 0 260 200\"><polygon points=\"75,75 155,75 155,155 75,155\" fill=\"#e8f2ff\" stroke=\"#1f4e79\" stroke-width=\"2\"/><polygon points=\"75,75 115,35 195,35 155,75\" fill=\"#f4f9ff\" stroke=\"#1f4e79\" stroke-width=\"2\"/><polygon points=\"155,75 195,35 195,115 155,155\" fill=\"#d7e8ff\" stroke=\"#1f4e79\" stroke-width=\"2\"/><line x1=\"75\" y1=\"155\" x2=\"115\" y2=\"115\" stroke=\"#1f4e79\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/><line x1=\"115\" y1=\"35\" x2=\"115\" y2=\"115\" stroke=\"#1f4e79\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/><line x1=\"115\" y1=\"115\" x2=\"195\" y2=\"115\" stroke=\"#1f4e79\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/></svg></div><br><div style=\"text-align:left\">Quel est le nom le plus précis de ce solide ?</div>&&un cube&&un pavé droit&&un prisme droit&&un cylindre&&une pyramide&&un cône&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 2,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 200\"><polygon points=\"55,85 190,85 190,150 55,150\" fill=\"#fff4dd\" stroke=\"#8a5a00\" stroke-width=\"2\"/><polygon points=\"55,85 100,45 235,45 190,85\" fill=\"#fff9eb\" stroke=\"#8a5a00\" stroke-width=\"2\"/><polygon points=\"190,85 235,45 235,110 190,150\" fill=\"#ffe5ad\" stroke=\"#8a5a00\" stroke-width=\"2\"/><line x1=\"55\" y1=\"150\" x2=\"100\" y2=\"110\" stroke=\"#8a5a00\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/><line x1=\"100\" y1=\"45\" x2=\"100\" y2=\"110\" stroke=\"#8a5a00\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/><line x1=\"100\" y1=\"110\" x2=\"235\" y2=\"110\" stroke=\"#8a5a00\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/></svg></div><br><div style=\"text-align:left\">Quel est le nom le plus précis de ce solide ?</div>&&un cube&&un pavé droit&&un prisme droit&&un cylindre&&une pyramide&&un cône&&",
        "answer": "[\"2\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 3,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"310\" height=\"auto\" viewBox=\"0 0 310 200\"><polygon points=\"210,125 275,50 275,125\" fill=\"#f5fff5\" stroke=\"#246b24\" stroke-width=\"2\"/><polygon points=\"75,145 140,70 275,50 210,125\" fill=\"#eef8ee\" stroke=\"#246b24\" stroke-width=\"2\"/><polygon points=\"75,145 210,125 275,125 140,145\" fill=\"#d9f5d9\" stroke=\"#246b24\" stroke-width=\"2\"/><polygon points=\"75,145 140,70 140,145\" fill=\"#eaffea\" stroke=\"#246b24\" stroke-width=\"2\"/><line x1=\"140\" y1=\"70\" x2=\"275\" y2=\"50\" stroke=\"#246b24\" stroke-width=\"2\"/><line x1=\"140\" y1=\"145\" x2=\"275\" y2=\"125\" stroke=\"#246b24\" stroke-width=\"2\"/><line x1=\"75\" y1=\"145\" x2=\"210\" y2=\"125\" stroke=\"#246b24\" stroke-width=\"2\"/></svg></div><br><div style=\"text-align:left\">Quel est le nom le plus précis de ce solide ?</div>&&un cube&&un pavé droit&&un prisme droit&&un cylindre&&une pyramide&&un cône&&\n",
        "answer": "[\"3\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 4,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"250\" height=\"auto\" viewBox=\"0 0 250 210\"><ellipse cx=\"125\" cy=\"55\" rx=\"70\" ry=\"25\" fill=\"#f0fbff\" stroke=\"#006b8f\" stroke-width=\"2\"/><line x1=\"55\" y1=\"55\" x2=\"55\" y2=\"155\" stroke=\"#006b8f\" stroke-width=\"2\"/><line x1=\"195\" y1=\"55\" x2=\"195\" y2=\"155\" stroke=\"#006b8f\" stroke-width=\"2\"/><ellipse cx=\"125\" cy=\"155\" rx=\"70\" ry=\"25\" fill=\"#dff4ff\" stroke=\"#006b8f\" stroke-width=\"2\"/><path d=\"M 55,155 A 70,25 0 0,0 195,155\" fill=\"none\" stroke=\"#006b8f\" stroke-width=\"2\"/><path d=\"M 55,155 A 70,25 0 0,1 195,155\" fill=\"none\" stroke=\"#006b8f\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/></svg></div><br><div style=\"text-align:left\">Quel est le nom le plus précis de ce solide ?</div>&&un cube&&un pavé droit&&un prisme droit&&un cylindre&&une pyramide&&un cône&&",
        "answer": "[\"4\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 5,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"280\" height=\"auto\" viewBox=\"0 0 280 210\"><polygon points=\"70,150 165,125 235,165 125,185\" fill=\"#fff0f0\" stroke=\"#9c2f2f\" stroke-width=\"2\"/><polygon points=\"70,150 145,35 165,125\" fill=\"#ffe1e1\" stroke=\"#9c2f2f\" stroke-width=\"2\"/><polygon points=\"165,125 145,35 235,165\" fill=\"#ffd0d0\" stroke=\"#9c2f2f\" stroke-width=\"2\"/><line x1=\"145\" y1=\"35\" x2=\"125\" y2=\"185\" stroke=\"#9c2f2f\" stroke-width=\"2\"/><line x1=\"145\" y1=\"35\" x2=\"70\" y2=\"150\" stroke=\"#9c2f2f\" stroke-width=\"2\"/><line x1=\"145\" y1=\"35\" x2=\"235\" y2=\"165\" stroke=\"#9c2f2f\" stroke-width=\"2\"/><line x1=\"70\" y1=\"150\" x2=\"235\" y2=\"165\" stroke=\"#9c2f2f\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/></svg></div><br><div style=\"text-align:left\">Quel est le nom le plus précis de ce solide ?</div>&&un cube&&un pavé droit&&un prisme droit&&un cylindre&&une pyramide&&un cône&&",
        "answer": "[\"5\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 6,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"250\" height=\"auto\" viewBox=\"0 0 250 210\"><line x1=\"125\" y1=\"35\" x2=\"55\" y2=\"155\" stroke=\"#7a3db8\" stroke-width=\"2\"/><line x1=\"125\" y1=\"35\" x2=\"195\" y2=\"155\" stroke=\"#7a3db8\" stroke-width=\"2\"/><ellipse cx=\"125\" cy=\"155\" rx=\"70\" ry=\"25\" fill=\"#f2e8ff\" stroke=\"#7a3db8\" stroke-width=\"2\"/><path d=\"M 55,155 A 70,25 0 0,0 195,155\" fill=\"none\" stroke=\"#7a3db8\" stroke-width=\"2\"/><path d=\"M 55,155 A 70,25 0 0,1 195,155\" fill=\"none\" stroke=\"#7a3db8\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/></svg></div><br><div style=\"text-align:left\">Quel est le nom le plus précis de ce solide ?</div>&&un cube&&un pavé droit&&un prisme droit&&un cylindre&&une pyramide&&un cône&&",
        "answer": "[\"6\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 7,
        "statement": "<div style=\"text-align:left\">Ce solide possède 6 faces carrées identiques. Quel est son nom le plus précis ?</div>&&un cube&&un pavé droit&&un prisme droit&&un cylindre&&une pyramide&&un cône&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 8,
        "statement": "<div style=\"text-align:left\">Ce solide possède 6 faces rectangulaires ; ses faces ne sont pas toutes carrées. Quel est son nom le plus précis ?</div>&&un cube&&un pavé droit&&un prisme droit&&un cylindre&&une pyramide&&un cône&&",
        "answer": "[\"2\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 9,
        "statement": "<div style=\"text-align:left\">Ce solide possède deux bases triangulaires superposables et des faces latérales rectangulaires. Quel est son nom le plus précis ?</div>&&un cube&&un pavé droit&&un prisme droit&&un cylindre&&une pyramide&&un cône&&",
        "answer": "[\"3\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 10,
        "statement": "<div style=\"text-align:left\">Ce solide possède une base circulaire et un seul sommet. Quel est son nom le plus précis ?</div>&&un cube&&un pavé droit&&un prisme droit&&un cylindre&&une pyramide&&un cône&&",
        "answer": "[\"6\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      }
    ]
  },
  {
    "id": "dnb_21",
    "num": 21,
    "title": "Périmètres polygones et disques",
    "level_tags": [
      "4e",
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 170\"><rect x=\"55\" y=\"45\" width=\"190\" height=\"85\" fill=\"#eef6ff\" stroke=\"#1f5f99\" stroke-width=\"2\"/><text x=\"150\" y=\"150\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${L} cm</text><text x=\"32\" y=\"92\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${l} cm</text></svg></div><br><div style=\"text-align:left\">Calcule le périmètre de ce rectangle.</div>",
        "answer": "[\"2*(L+l)\"]",
        "options": {
          "formula_code": "L=RD(7,15)\nl=RD(3,6)"
        },
        "footer": "Réponse : [[formula]] cm"
      },
      {
        "n": 2,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"240\" height=\"auto\" viewBox=\"0 0 240 190\"><rect x=\"60\" y=\"35\" width=\"120\" height=\"120\" fill=\"#fff3e6\" stroke=\"#b85c00\" stroke-width=\"2\"/><text x=\"120\" y=\"178\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${c} cm</text></svg></div><br><div style=\"text-align:left\">Calcule le périmètre de ce carré.</div>",
        "answer": "[\"4*c\"]",
        "options": {
          "formula_code": "c=RD(3,14)"
        },
        "footer": "Réponse : [[formula]] cm"
      },
      {
        "n": 3,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 200\"><polygon points=\"65,150 235,150 145,45\" fill=\"#f0fff0\" stroke=\"#267326\" stroke-width=\"2\"/><text x=\"150\" y=\"175\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${a} cm</text><text x=\"88\" y=\"92\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${b} cm</text><text x=\"215\" y=\"92\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${c} cm</text></svg></div><br><div style=\"text-align:left\">Calcule le périmètre de ce triangle.</div>",
        "answer": "[\"a+b+c\"]",
        "options": {
          "formula_code": "a=RD(5,11)\nb=RD(5,9)\nc=RD(5,9)"
        },
        "footer": "Réponse : [[formula]] cm"
      },
      {
        "n": 4,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"270\" height=\"auto\" viewBox=\"0 0 270 210\"><polygon points=\"135,30 205,80 180,160 90,160 65,80\" fill=\"#f8efff\" stroke=\"#6b2b91\" stroke-width=\"2\"/><text x=\"135\" y=\"188\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${c} cm</text></svg></div><br><div style=\"text-align:left\">Ce pentagone est régulier : ses 5 côtés ont la même longueur. Calcule son périmètre.</div>",
        "answer": "[\"5*c\"]",
        "options": {
          "formula_code": "c=RD(3,12)"
        },
        "footer": "Réponse : [[formula]] cm"
      },
      {
        "n": 5,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"310\" height=\"auto\" viewBox=\"0 0 310 190\"><polygon points=\"70,135 235,135 265,65 100,65\" fill=\"#fffbea\" stroke=\"#9a7b00\" stroke-width=\"2\"/><text x=\"153\" y=\"158\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${L} cm</text><text x=\"75\" y=\"95\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${l} cm</text></svg></div><br><div style=\"text-align:left\">Calcule le périmètre de ce parallélogramme.</div>",
        "answer": "[\"2*(L+l)\"]",
        "options": {
          "formula_code": "L=RD(7,16)\nl=RD(3,9)"
        },
        "footer": "Réponse : [[formula]] cm"
      },
      {
        "n": 6,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"310\" height=\"auto\" viewBox=\"0 0 310 220\"><polygon points=\"60,170 230,170 230,112 150,112 150,55 60,55\" fill=\"#eef8f8\" stroke=\"#236b6b\" stroke-width=\"2\"/><text x=\"145\" y=\"198\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${W} cm</text><text x=\"32\" y=\"116\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${H} cm</text><text x=\"105\" y=\"45\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${a} cm</text><text x=\"170\" y=\"86\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${b} cm</text></svg></div><br><div style=\"text-align:left\">Calcule le périmètre de ce polygone.</div>",
        "answer": "[\"2*(W+H)\"]",
        "options": {
          "formula_code": "W=RD(8,16)\nH=RD(6,13)\na=RD(2,W-3)\nb=RD(2,H-3)"
        },
        "footer": "Réponse : [[formula]] cm"
      },
      {
        "n": 7,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"260\" height=\"auto\" viewBox=\"0 0 260 190\"><circle cx=\"130\" cy=\"90\" r=\"62\" fill=\"#eef4ff\" stroke=\"#315b9f\" stroke-width=\"2\"/><line x1=\"130\" y1=\"90\" x2=\"192\" y2=\"90\" stroke=\"#315b9f\" stroke-width=\"2\"/><text x=\"162\" y=\"82\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${r} cm</text></svg></div><div style=\"text-align:center\">Calcule le périmètre de ce disque.\nOn prendra $$\\pi\\approx 3,14$$.</div>",
        "answer": "[\"CUT(2*3,14*r,2)\"]",
        "options": {
          "formula_code": "r=RD(2,9)"
        },
        "footer": "Réponse : [[formula]] cm"
      },
      {
        "n": 8,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"270\" height=\"auto\" viewBox=\"0 0 270 190\"><circle cx=\"135\" cy=\"90\" r=\"62\" fill=\"#fff0f0\" stroke=\"#a13030\" stroke-width=\"2\"/><line x1=\"73\" y1=\"90\" x2=\"197\" y2=\"90\" stroke=\"#a13030\" stroke-width=\"2\"/><text x=\"135\" y=\"82\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${d} cm</text></svg></div><br><div style=\"text-align:center\">Calcule le périmètre de ce disque.\nOn prendra $$\\pi\\approx 3,14$$.</div>",
        "answer": "[\"CUT(3,14*d,2)\"]",
        "options": {
          "formula_code": "d=RD(4,18)"
        },
        "footer": "Réponse : [[formula]] cm"
      },
      {
        "n": 9,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 210\"><polygon points=\"65,155 140,55 250,85 225,160\" fill=\"#f7f7ff\" stroke=\"#3f3f8f\" stroke-width=\"2\"/><text x=\"103\" y=\"100\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${a} cm</text><text x=\"195\" y=\"58\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${b} cm</text><text x=\"252\" y=\"126\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${c} cm</text><text x=\"145\" y=\"182\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${d} cm</text></svg></div><br><div style=\"text-align:left\">Calcule le périmètre de ce quadrilatère.</div>",
        "answer": "[\"a+b+c+d\"]",
        "options": {
          "formula_code": "a=RD(4,10)\nb=RD(5,12)\nc=RD(4,10)\nd=RD(5,12)"
        },
        "footer": "Réponse : [[formula]] cm"
      },
      {
        "n": 10,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 200\"><polygon points=\"150,28 230,72 230,148 150,192 70,148 70,72\" fill=\"#f1fff1\" stroke=\"#2b7a2b\" stroke-width=\"2\"/><text x=\"150\" y=\"22\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${c} cm</text></svg></div><br><div style=\"text-align:left\">Cet hexagone est régulier : ses 6 côtés ont la même longueur. Calcule son périmètre.</div>",
        "answer": "[\"6*c\"]",
        "options": {
          "formula_code": "c=RD(2,10)"
        },
        "footer": "Réponse : [[formula]] cm"
      }
    ]
  },
  {
    "id": "dnb_22",
    "num": 22,
    "title": "Aires triangle rectangle disque",
    "level_tags": [
      "4e",
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "Calcule l'aire de ce rectangle.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 170\"><rect x=\"55\" y=\"45\" width=\"190\" height=\"80\" fill=\"#eaf3ff\" stroke=\"#1f5f99\" stroke-width=\"2\"/><text x=\"150\" y=\"143\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${L} cm</text><text x=\"38\" y=\"90\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${l} cm</text></svg></div>",
        "answer": "[\"L*l\"]",
        "options": {
          "formula_code": "L=RD(5,14)\nl=RD(2,9)\n"
        },
        "footer": "Aire = [[formula]] cm²"
      },
      {
        "n": 2,
        "statement": "Un rectangle mesure ${L} m de longueur et ${l} m de largeur. Calcule son aire.",
        "answer": "[\"L*l\"]",
        "options": {
          "formula_code": "L=RD(8,25)\nl=RD(3,12)\n"
        },
        "footer": "Aire = [[formula]] m²"
      },
      {
        "n": 3,
        "statement": "Calcule l'aire de ce triangle.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"310\" height=\"auto\" viewBox=\"0 0 310 205\"><polygon points=\"55,155 255,155 185,45\" fill=\"#fff4e6\" stroke=\"#b35c00\" stroke-width=\"2\"/><line x1=\"185\" y1=\"45\" x2=\"185\" y2=\"155\" stroke=\"#b35c00\" stroke-width=\"2\" stroke-dasharray=\"6,4\"/><polyline points=\"185,142 198,142 198,155\" fill=\"none\" stroke=\"#b35c00\" stroke-width=\"2\"/><text x=\"155\" y=\"178\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">base ${b} cm</text><text x=\"202\" y=\"105\" font-family=\"serif\" font-size=\"18\">hauteur ${h} cm</text></svg></div>",
        "answer": "[\"CUT(b*h/2,2)\"]",
        "options": {
          "formula_code": "b=RD(6,18)\nh=RD(4,14)\n"
        },
        "footer": "Aire = [[formula]] cm²"
      },
      {
        "n": 4,
        "statement": "Ce triangle est rectangle. Calcule son aire.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 190\"><polygon points=\"70,145 70,45 240,145\" fill=\"#f0fff0\" stroke=\"#247524\" stroke-width=\"2\"/><polyline points=\"70,128 87,128 87,145\" fill=\"none\" stroke=\"#247524\" stroke-width=\"2\"/><text x=\"48\" y=\"100\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${a} cm</text><text x=\"155\" y=\"168\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${b} cm</text></svg></div>",
        "answer": "[\"CUT(a*b/2,2)\"]",
        "options": {
          "formula_code": "a=RD(3,12)\nb=RD(4,16)\n"
        },
        "footer": "Aire = [[formula]] cm²"
      },
      {
        "n": 5,
        "statement": "Calcule l'aire du disque. On prendra $$\\pi\\approx 3,14$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"260\" height=\"auto\" viewBox=\"0 0 260 190\"><circle cx=\"130\" cy=\"95\" r=\"70\" fill=\"#f2edff\" stroke=\"#6040a0\" stroke-width=\"2\"/><line x1=\"130\" y1=\"95\" x2=\"200\" y2=\"95\" stroke=\"#6040a0\" stroke-width=\"2\"/><circle cx=\"130\" cy=\"95\" r=\"3\" fill=\"#6040a0\"/><text x=\"165\" y=\"85\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${r} cm</text></svg></div>",
        "answer": "[\"CUT(3.14*r*r,2)\"]",
        "options": {
          "formula_code": "r=RD(2,10)\n"
        },
        "footer": "Aire = [[formula]] cm²"
      },
      {
        "n": 6,
        "statement": "La façade ci-dessous est formée d'un rectangle et d'un triangle. Calcule son aire totale.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"330\" height=\"auto\" viewBox=\"0 0 330 245\"><rect x=\"80\" y=\"105\" width=\"170\" height=\"95\" fill=\"#eaf3ff\" stroke=\"#1f5f99\" stroke-width=\"2\"/><polygon points=\"80,105 165,45 250,105\" fill=\"#fff4e6\" stroke=\"#b35c00\" stroke-width=\"2\"/><line x1=\"165\" y1=\"45\" x2=\"165\" y2=\"105\" stroke=\"#b35c00\" stroke-width=\"2\" stroke-dasharray=\"6,4\"/><text x=\"165\" y=\"224\" font-family=\"serif\" font-size=\"17\" text-anchor=\"middle\">largeur ${L} m</text><text x=\"62\" y=\"155\" font-family=\"serif\" font-size=\"17\" text-anchor=\"middle\">${H} m</text><text x=\"188\" y=\"78\" font-family=\"serif\" font-size=\"17\">toit ${h} m</text></svg></div>",
        "answer": "[\"L*H+L*h/2\"]",
        "options": {
          "formula_code": "L=RD(6,14)\nH=RD(3,8)\nh=RD(2,6)\n"
        },
        "footer": "Aire totale = [[formula]] m²"
      },
      {
        "n": 7,
        "statement": "Un triangle a pour base ${b} cm et pour hauteur correspondante ${h} cm. Calcule son aire.",
        "answer": "[\"CUT(b*h/2,2)\"]",
        "options": {
          "formula_code": "b=RD(10,30)\nh=RD(5,20)\n"
        },
        "footer": "Aire = [[formula]] cm²"
      },
      {
        "n": 8,
        "statement": "Calcule l'aire du disque de diamètre ${d} cm. On prendra $$\\pi\\approx 3,14$$.",
        "answer": "[\"CUT(3.14*d*d/4,2)\"]",
        "options": {
          "formula_code": "d=RD(2,12)*2\n"
        },
        "footer": "Aire = [[formula]] cm²"
      },
      {
        "n": 9,
        "statement": "Calcule l'aire de ce rectangle.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 175\"><rect x=\"45\" y=\"50\" width=\"230\" height=\"70\" fill=\"#fff9db\" stroke=\"#927000\" stroke-width=\"2\"/><text x=\"160\" y=\"143\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${L} dm</text><text x=\"30\" y=\"92\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${l} dm</text></svg></div>",
        "answer": "[\"L*l\"]",
        "options": {
          "formula_code": "L=RD(12,30)\nl=RD(4,11)\n"
        },
        "footer": "Aire = [[formula]] dm²"
      },
      {
        "n": 10,
        "statement": "Un disque a un rayon de ${r} m. Calcule son aire. On prendra $$\\pi\\approx 3,14$$.",
        "answer": "[\"CUT(3.14*r*r,2)\"]",
        "options": {
          "formula_code": "r=RD(3,15)\n"
        },
        "footer": "Aire = [[formula]] m²"
      }
    ]
  },
  {
    "id": "dnb_23",
    "num": 23,
    "title": "Volumes cube pavé prisme cylindre",
    "level_tags": [
      "4e",
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "Calcule le volume de ce cube.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"290\" height=\"auto\" viewBox=\"0 0 290 190\"><polygon points=\"85,70 170,45 230,95 145,120\" fill=\"#f5fbff\" stroke=\"#1f5f99\" stroke-width=\"2\"/><polygon points=\"85,70 145,120 145,170 85,120\" fill=\"#dcecff\" stroke=\"#1f5f99\" stroke-width=\"2\"/><polygon points=\"145,120 230,95 230,145 145,170\" fill=\"#eaf3ff\" stroke=\"#1f5f99\" stroke-width=\"2\"/><line x1=\"85\" y1=\"70\" x2=\"170\" y2=\"45\" stroke=\"#1f5f99\" stroke-width=\"2\"/><line x1=\"170\" y1=\"45\" x2=\"230\" y2=\"95\" stroke=\"#1f5f99\" stroke-width=\"2\"/><text x=\"113\" y=\"151\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${c} cm</text></svg></div>",
        "answer": "[\"c^3\"]",
        "options": {
          "formula_code": "c=RD(2,9)\n"
        },
        "footer": "Volume = [[formula]] cm³"
      },
      {
        "n": 2,
        "statement": "Calcule le volume de ce pavé droit.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"330\" height=\"auto\" viewBox=\"0 0 330 200\"><polygon points=\"70,80 210,80 265,120 125,120\" fill=\"#fff7e8\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"70,80 125,120 125,170 70,130\" fill=\"#ffe7c2\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"125,120 265,120 265,170 125,170\" fill=\"#ffefd8\" stroke=\"#b36b00\" stroke-width=\"2\"/><line x1=\"70\" y1=\"130\" x2=\"210\" y2=\"130\" stroke=\"#b36b00\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/><line x1=\"210\" y1=\"80\" x2=\"210\" y2=\"130\" stroke=\"#b36b00\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/><line x1=\"210\" y1=\"130\" x2=\"265\" y2=\"170\" stroke=\"#b36b00\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/><text x=\"195\" y=\"190\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${l} cm</text><text x=\"78\" y=\"165\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${h} cm</text><text x=\"158\" y=\"72\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${L} cm</text></svg></div>",
        "answer": "[\"L*l*h\"]",
        "options": {
          "formula_code": "L=RD(5,14)\nl=RD(2,8)\nh=RD(2,7)\n"
        },
        "footer": "Volume = [[formula]] cm³"
      },
      {
        "n": 3,
        "statement": "Calcule le volume de ce prisme droit à base triangulaire.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"340\" height=\"auto\" viewBox=\"0 0 340 210\"><polygon points=\"170,125 220,55 270,125\" fill=\"#f5fff5\" stroke=\"#246b24\" stroke-width=\"2\"/><polygon points=\"80,145 130,75 220,55 170,125\" fill=\"#eef8ee\" stroke=\"#246b24\" stroke-width=\"2\"/><polygon points=\"130,75 180,145 270,125 220,55\" fill=\"#f5fff5\" stroke=\"#246b24\" stroke-width=\"2\"/><polygon points=\"80,145 180,145 270,125 170,125\" fill=\"#d9f5d9\" stroke=\"#246b24\" stroke-width=\"2\"/><polygon points=\"80,145 130,75 180,145\" fill=\"#eaffea\" stroke=\"#246b24\" stroke-width=\"2\"/><line x1=\"130\" y1=\"75\" x2=\"130\" y2=\"145\" stroke=\"#246b24\" stroke-width=\"1.5\" stroke-dasharray=\"4,3\"/><line x1=\"170\" y1=\"125\" x2=\"220\" y2=\"55\" stroke=\"#246b24\" stroke-width=\"2\"/><line x1=\"220\" y1=\"55\" x2=\"270\" y2=\"125\" stroke=\"#246b24\" stroke-width=\"2\"/><line x1=\"170\" y1=\"125\" x2=\"270\" y2=\"125\" stroke=\"#246b24\" stroke-width=\"2\"/></svg></div><br>La base triangulaire a pour base ${b} cm et pour hauteur ${ht} cm. La longueur du prisme est ${p} cm.",
        "answer": "[\"b*ht*p/2\"]",
        "options": {
          "formula_code": "b=RD(2,7)*2\nht=RD(2,8)\np=RD(4,12)\n"
        },
        "footer": "Volume = [[formula]] cm³"
      },
      {
        "n": 4,
        "statement": "Calcule le volume de ce cylindre. On prendra $$\\pi\\approx 3,14$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"280\" height=\"auto\" viewBox=\"0 0 280 220\"><ellipse cx=\"140\" cy=\"55\" rx=\"70\" ry=\"24\" fill=\"#f7ecff\" stroke=\"#7a3aa0\" stroke-width=\"2\"/><path d=\"M 70,55 L 70,165\" stroke=\"#7a3aa0\" stroke-width=\"2\" fill=\"none\"/><path d=\"M 210,55 L 210,165\" stroke=\"#7a3aa0\" stroke-width=\"2\" fill=\"none\"/><ellipse cx=\"140\" cy=\"165\" rx=\"70\" ry=\"24\" fill=\"#ead7f7\" stroke=\"#7a3aa0\" stroke-width=\"2\"/><line x1=\"140\" y1=\"55\" x2=\"210\" y2=\"55\" stroke=\"#7a3aa0\" stroke-width=\"2\"/><text x=\"176\" y=\"47\" font-family=\"serif\" font-size=\"17\" text-anchor=\"middle\">r = ${r} cm</text><text x=\"232\" y=\"113\" font-family=\"serif\" font-size=\"17\" text-anchor=\"middle\">${h} cm</text></svg></div>",
        "answer": "[\"CUT(3.14*r*r*h,2)\"]",
        "options": {
          "formula_code": "r=RD(2,8)\nh=RD(3,12)\n"
        },
        "footer": "Volume ≈ [[formula]] cm³"
      },
      {
        "n": 5,
        "statement": "Un dé cubique a une arête de $$${a}$$ mm. Calcule son volume.",
        "answer": "[\"a^3\"]",
        "options": {
          "formula_code": "a=RD(4,12)\n"
        },
        "footer": "Volume = [[formula]] mm³"
      },
      {
        "n": 6,
        "statement": "Un aquarium a la forme d'un pavé droit. Il mesure $$${L}$$ cm de long, $$${l}$$ cm de large et $$${h}$$ cm de haut. Calcule son volume.",
        "answer": "[\"L*l*h\"]",
        "options": {
          "formula_code": "L=RD(30,80)\nl=RD(15,40)\nh=RD(20,50)\n"
        },
        "footer": "Volume = [[formula]] cm³"
      },
      {
        "n": 7,
        "statement": "Un prisme droit a une base d'aire $$${a}$$ cm² et une hauteur de $$${h}$$ cm. Calcule son volume.",
        "answer": "[\"a*h\"]",
        "options": {
          "formula_code": "a=RD(12,80)\nh=RD(3,15)\n"
        },
        "footer": "Volume = [[formula]] cm³"
      },
      {
        "n": 8,
        "statement": "Calcule le volume de ce prisme droit.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"360\" height=\"auto\" viewBox=\"0 0 360 230\"><polygon points=\"150,120 190,70 270,70 310,120\" fill=\"#fffaf0\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"85,145 125,95 190,70 150,120\" fill=\"#fff0d8\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"125,95 205,95 270,70 190,70\" fill=\"#f8efd8\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"205,95 245,145 310,120 270,70\" fill=\"#f1e2c8\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"85,145 245,145 310,120 150,120\" fill=\"#ead7b5\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"85,145 125,95 205,95 245,145\" fill=\"#f5e9d3\" stroke=\"#b36b00\" stroke-width=\"2\"/><line x1=\"245\" y1=\"165\" x2=\"310\" y2=\"140\" stroke=\"#b36b00\" stroke-width=\"2\"/></svg></div><div style=\"text-align:center;font-size:18px\">aire base = ${a} cm² &nbsp;&nbsp;&nbsp; hauteur ${h} cm</div>",
        "answer": "[\"a*h\"]",
        "options": {
          "formula_code": "a=RD(15,90)\nh=RD(2,12)\n"
        },
        "footer": "Volume = [[formula]] cm³"
      },
      {
        "n": 9,
        "statement": "Calcule le volume de ce cylindre. On prendra $$\\pi\\approx 3,14$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 220\"><ellipse cx=\"145\" cy=\"55\" rx=\"80\" ry=\"25\" fill=\"#effaf5\" stroke=\"#1f7a4d\" stroke-width=\"2\"/><path d=\"M 65,55 L 65,165\" stroke=\"#1f7a4d\" stroke-width=\"2\" fill=\"none\"/><path d=\"M 225,55 L 225,165\" stroke=\"#1f7a4d\" stroke-width=\"2\" fill=\"none\"/><ellipse cx=\"145\" cy=\"165\" rx=\"80\" ry=\"25\" fill=\"#d9f5e8\" stroke=\"#1f7a4d\" stroke-width=\"2\"/><line x1=\"65\" y1=\"55\" x2=\"225\" y2=\"55\" stroke=\"#1f7a4d\" stroke-width=\"2\"/><text x=\"145\" y=\"47\" font-family=\"serif\" font-size=\"17\" text-anchor=\"middle\">diamètre ${d} cm</text><text x=\"248\" y=\"113\" font-family=\"serif\" font-size=\"17\" text-anchor=\"middle\">${h} cm</text></svg></div>",
        "answer": "[\"CUT(3.14*(d/2)*(d/2)*h,2)\"]",
        "options": {
          "formula_code": "d=RD(2,9)*2\nh=RD(3,12)\n"
        },
        "footer": "Volume ≈ [[formula]] cm³"
      },
      {
        "n": 10,
        "statement": "Un solide est composé de deux cubes identiques d'arête $$${a}$$ cm collés l'un contre l'autre. Calcule le volume total.",
        "answer": "[\"2*a^3\"]",
        "options": {
          "formula_code": "a=RD(2,8)\n"
        },
        "footer": "Volume total = [[formula]] cm³"
      }
    ]
  },
  {
    "id": "dnb_24",
    "num": 24,
    "title": "Pythagore situations égalité critique",
    "level_tags": [
      "4e",
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "Le triangle représenté permet-il d'appliquer directement le théorème de Pythagore ?<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"260\" height=\"auto\" viewBox=\"0 0 260 170\"><polygon points=\"60,125 60,45 205,125\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><polyline points=\"60,105 80,105 80,125\" fill=\"none\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"46\" y=\"138\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"45\" y=\"42\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"212\" y=\"138\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text></svg></div>&&Oui, car un angle droit est indiqué&&Non, car aucune longueur n'est donnée&&Non, car le triangle n'est pas rectangle&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 2,
        "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"260\" height=\"auto\" viewBox=\"0 0 260 170\"><polygon points=\"55,130 110,40 210,115\" fill=\"#fff8e8\" stroke=\"#b36b00\" stroke-width=\"2\"/><text x=\"40\" y=\"145\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"104\" y=\"34\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"218\" y=\"122\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text></svg></div>Sur cette figure, peut-on appliquer directement le théorème de Pythagore ?&&Oui, toujours dans n'importe quel triangle&&Non, il faut savoir que le triangle est rectangle&&Oui, si le triangle semble presque rectangle&&",
        "answer": "[\"2\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 3,
        "statement": "Le triangle $$ABC$$ est rectangle en $$B$$. Quelle égalité de Pythagore est correcte ?&&$$AB^2=AC^2+BC^2$$&&$$AC^2=AB^2+BC^2$$&&$$BC^2=AB^2+AC^2$$&&",
        "answer": "[\"2\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 4,
        "statement": "Le triangle $$RST$$ est rectangle en $$T$$. Quelle est l'hypoténuse ?&&Le côté $$[RS]$$&&Le côté $$[RT]$$&&Le côté $$[ST]$$&&On ne peut pas savoir&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 5,
        "statement": "Dans un triangle rectangle, les côtés de l'angle droit mesurent ${a} cm et ${b} cm. On appelle $$h$$ l'hypoténuse. Calcule $$h^2$$.",
        "answer": "[\"a*a+b*b\"]",
        "options": {
          "formula_code": "a=RD(3,12)\nb=RD(4,15)"
        },
        "footer": "$$h^2=[[formula]]$$"
      },
      {
        "n": 6,
        "statement": "Dans un triangle rectangle, les deux côtés de l'angle droit mesurent ${a} cm et ${b} cm. Calcule la longueur de l'hypoténuse.",
        "answer": "[\"c\"]",
        "options": {
          "formula_code": "k=RD(0,4)\na=[3,5,6,8,7][k]\nb=[4,12,8,15,24][k]\nc=[5,13,10,17,25][k]"
        },
        "footer": "$$[[formula]]\\text{ cm}$$"
      },
      {
        "n": 7,
        "statement": "Dans un triangle rectangle, l'hypoténuse mesure ${c} cm et un côté de l'angle droit mesure ${a} cm. Calcule la longueur de l'autre côté de l'angle droit.",
        "answer": "[\"b\"]",
        "options": {
          "formula_code": "k=RD(0,4)\na=[3,5,6,8,7][k]\nb=[4,12,8,15,24][k]\nc=[5,13,10,17,25][k]"
        },
        "footer": "$$[[formula]]\\text{ cm}$$"
      },
      {
        "n": 8,
        "statement": "Un triangle a pour côtés ${a} cm, ${b} cm et ${c} cm. On vérifie que $$${c}^2=${a}^2+${b}^2$$. Quelle conclusion est correcte ?&&Le triangle est rectangle&&Le triangle est équilatéral&&Le triangle n'existe pas&&On ne peut rien conclure&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "k=RD(0,4)\na=[3,5,6,8,7][k]\nb=[4,12,8,15,24][k]\nc=[5,13,10,17,25][k]",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 9,
        "statement": "Un triangle a pour côtés ${a} cm, ${b} cm et ${c} cm. On calcule : $$${a}^2+${b}^2=${s}$$ et $$${c}^2=${t}$$. Peut-on conclure qu'il est rectangle ?&&Oui, car les trois longueurs sont connues&&Non, car l'égalité de Pythagore n'est pas vérifiée&&Oui, car le plus grand côté est ${c} cm&&Non, car on ne peut jamais utiliser la réciproque&&",
        "answer": "[\"2\"]",
        "options": {
          "formula_code": "a=RD(3,8)\nb=RD(4,10)\nc=a+b-1\ns=a*a+b*b\nt=c*c",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 10,
        "statement": "Dans un triangle rectangle, on dit que l'hypoténuse mesure ${h} cm et qu'un autre côté mesure ${c} cm. Que faut-il penser de ces données ?&&C'est impossible : l'hypoténuse doit être le plus grand côté&&C'est toujours possible&&Il suffit d'additionner les deux longueurs&&Le théorème de Pythagore ne concerne pas les longueurs&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "h=RD(4,9)\nc=h+RD(1,4)",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      }
    ]
  },
  {
    "id": "dnb_25",
    "num": 25,
    "title": "Thalès triangles emboîtés",
    "level_tags": [
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "Sur la figure, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE)$$ est parallèle à $$(BC)$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"170\" y2=\"94\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"175\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>Peut-on utiliser le théorème de Thalès ?&&Oui&&Non, car il manque un angle droit&&Non, car les triangles ne sont pas emboîtés&&Non, car les droites ne sont pas parallèles&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 2,
        "statement": "Dans la configuration suivante, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE) // (BC)$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"170\" y2=\"94\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"175\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>Quelle égalité de rapports est correcte ?&&$$\\dfrac{AD}{AB}=\\dfrac{AE}{AC}=\\dfrac{DE}{BC}$$&&$$\\dfrac{AD}{DB}=\\dfrac{AE}{EC}=\\dfrac{DE}{BC}$$&&$$\\dfrac{AB}{AD}=\\dfrac{AE}{EC}=\\dfrac{BC}{DE}$$&&$$\\dfrac{AD}{AC}=\\dfrac{AE}{AB}=\\dfrac{DE}{BC}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 3,
        "statement": "Dans la figure, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE)//(BC)$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"170\" y2=\"94\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"175\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>On donne $$AD=${AD}\\text{ cm}$$, $$AB=${AB}\\text{ cm}$$ et $$AC=${AC}\\text{ cm}$$. Calcule $$AE$$.",
        "answer": "[\"AE\"]",
        "options": {
          "formula_code": "d=RD(2,7)\nk=RD(2,4)\nc=RD(3,9)\nAD=d\nAB=d*k\nAE=c\nAC=c*k"
        },
        "footer": "$$AE=[[formula]]\\text{ cm}$$"
      },
      {
        "n": 4,
        "statement": "Dans la figure, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE)//(BC)$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"170\" y2=\"94\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"175\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>On donne $$AD=${AD}\\text{ cm}$$, $$AE=${AE}\\text{ cm}$$ et $$AC=${AC}\\text{ cm}$$. Calcule $$AB$$.",
        "answer": "[\"AB\"]",
        "options": {
          "formula_code": "d=RD(2,7)\nk=RD(2,4)\ne=RD(2,8)\nAD=d\nAB=d*k\nAE=e\nAC=e*k"
        },
        "footer": "$$AB=[[formula]]\\text{ cm}$$"
      },
      {
        "n": 5,
        "statement": "Dans la figure, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE)//(BC)$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"170\" y2=\"94\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"175\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>On donne $$AD=${AD}\\text{ cm}$$, $$AB=${AB}\\text{ cm}$$ et $$BC=${BC}\\text{ cm}$$. Calcule $$DE$$.",
        "answer": "[\"DE\"]",
        "options": {
          "formula_code": "d=RD(2,7)\nk=RD(2,4)\ne=RD(3,9)\nAD=d\nAB=d*k\nDE=e\nBC=e*k"
        },
        "footer": "$$DE=[[formula]]\\text{ cm}$$"
      },
      {
        "n": 6,
        "statement": "On sait que $$D$$ est sur $$[AB]$$ et $$E$$ est sur $$[AC]$$. On mesure : $$AD=${AD}\\text{ cm}$$, $$AB=${AB}\\text{ cm}$$, $$AE=${AE}\\text{ cm}$$ et $$AC=${AC}\\text{ cm}$$.<br>Les rapports $$\\dfrac{AD}{AB}$$ et $$\\dfrac{AE}{AC}$$ sont-ils égaux ?&&Oui, donc on peut conclure que $$(DE)//(BC)$$&&Non, donc  $$(DE)$$ et $$(BC)$$ ne sont pas parallèles&&Oui, car les deux petits segments sont égaux&&Non, donc  $$(DE)$$ et $$(BC)$$ sont parallèles&&",
        "answer": "[\"2\"]",
        "options": {
          "formula_code": "d=RD(2,7)\nk=RD(2,4)\nc=RD(3,8)\nAD=d\nAB=d*k\nAC=c*k\nAE=c+1",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 7,
        "statement": "Sur cette figure, $$D$$ est sur $$[AB]$$ et $$E$$ est sur $$[AC]$$, mais les droites $$(DE)$$ et $$(BC)$$ ne sont pas parallèles.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#fff8e8\" stroke=\"#b36b00\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"195\" y2=\"108\" stroke=\"#b36b00\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"195\" y=\"108\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>Peut-on appliquer directement le théorème de Thalès ?&&Oui, car il y a deux triangles&&Non, car il manque la condition de parallélisme&&Oui, car les points sont alignés&&Non, car il faudrait un angle droit&&",
        "answer": "[\"2\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 8,
        "statement": "Dans la figure, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE)//(BC)$$. On cherche $$x=AE$$.<br>On connaît $$AD=${AD}\\text{ cm}$$, $$AB=${AB}\\text{ cm}$$ et $$AC=${AC}\\text{ cm}$$.<br>Quelle égalité permet de calculer $$x$$ ?&&$$\\dfrac{AD}{AB}=\\dfrac{x}{AC}$$&&$$\\dfrac{AB}{AD}=\\dfrac{x}{AC}$$&&$$\\dfrac{AD}{AC}=\\dfrac{x}{AB}$$&&$$AD+AB=x+AC$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "d=RD(2,7)\nk=RD(2,4)\nc=RD(3,9)\nAD=d\nAB=d*k\nAC=c*k",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 9,
        "statement": "Dans une configuration de Thalès, $$D$$ appartient au segment $$[AB]$$. Après un calcul, on obtient $$AD=${x}\\text{ cm}$$ alors que $$AB=${AB}\\text{ cm}$$. Que faut-il penser de ce résultat ?&&Le résultat est cohérent&&Le résultat est impossible : si $$D$$ est sur $$[AB]$$, alors $$AD$$ ne peut pas être plus grand que $$AB$$&&Le résultat prouve que le triangle est rectangle&&Le résultat est toujours acceptable avec Thalès&&",
        "answer": "[\"2\"]",
        "options": {
          "formula_code": "AB=RD(6,14)\nx=AB+RD(1,6)",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 10,
        "statement": "Dans la figure, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE)//(BC)$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"170\" y2=\"94\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"175\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>On donne $$AD=${AD}\\text{ cm}$$, $$AB=${AB}\\text{ cm}$$ et $$DE=${DE}\\text{ cm}$$. Calcule $$BC$$.",
        "answer": "[\"BC\"]",
        "options": {
          "formula_code": "d=RD(2,7)\nk=RD(2,4)\ne=RD(3,9)\nAD=d\nAB=d*k\nDE=e\nBC=e*k"
        },
        "footer": "$$BC=[[formula]]\\text{ cm}$$"
      }
    ]
  },
  {
    "id": "dnb_26",
    "num": 26,
    "title": "Cosinus triangle rectangle",
    "level_tags": [
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "Dans quel type de triangle peut-on utiliser directement la ligne trigonométrique cosinus ?&&dans n'importe quel triangle&&dans un triangle rectangle&&dans un triangle isocèle uniquement&&dans un triangle équilatéral uniquement&&",
        "answer": "[\"2\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 2,
        "statement": "Dans le triangle ABC rectangle en B, quelle égalité correspond à $$\\cos(\\widehat{A})$$ ?<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"310\" height=\"auto\" viewBox=\"0 0 310 190\"><polygon points=\"70,140 240,140 70,55\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><polyline points=\"70,125 85,125 85,140\" fill=\"none\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><path d=\"M 70,90 A 35,35 0 0 0 101,71\" fill=\"none\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"55\" y=\"154\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"246\" y=\"154\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"55\" y=\"50\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text></svg></div>&&$$\\cos(\\widehat{A})=\\dfrac{AB}{AC}$$&&$$\\cos(\\widehat{A})=\\dfrac{BC}{AC}$$&&$$\\cos(\\widehat{A})=\\dfrac{AB}{BC}$$&&$$\\cos(\\widehat{A})=\\dfrac{AC}{AB}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 3,
        "statement": "Dans un triangle rectangle, le côté adjacent à l'angle étudié mesure ${adj} cm et l'hypoténuse mesure ${hyp} cm. Calcule le cosinus de cet angle. Arrondis au centième.",
        "answer": "[\"CUT(adj/hyp,2)\"]",
        "options": {
          "formula_code": "setNB(4)\nhyp=RD(6,15)\nadj=RD(2,hyp-1)"
        },
        "footer": "$$\\cos(\\widehat{A})=[[formula]]$$"
      },
      {
        "n": 4,
        "statement": "Dans le triangle MNP rectangle en P, quelle égalité correspond à $$\\cos(\\widehat{M})$$ ?<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"310\" height=\"auto\" viewBox=\"0 0 310 190\"><polygon points=\"70,140 245,140 245,55\" fill=\"#f3fff0\" stroke=\"#246b24\" stroke-width=\"2\"/><polyline points=\"230,140 230,125 245,125\" fill=\"none\" stroke=\"#246b24\" stroke-width=\"2\"/><path d=\"M 105,140 A 35,35 0 0 0 101,125\" fill=\"none\" stroke=\"#246b24\" stroke-width=\"2\"/><text x=\"55\" y=\"154\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">M</text><text x=\"252\" y=\"154\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">P</text><text x=\"252\" y=\"55\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">N</text></svg></div>&&$$\\cos(\\widehat{M})=\\dfrac{MP}{MN}$$&&$$\\cos(\\widehat{M})=\\dfrac{NP}{MN}$$&&$$\\cos(\\widehat{M})=\\dfrac{MP}{NP}$$&&$$\\cos(\\widehat{M})=\\dfrac{MN}{MP}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 5,
        "statement": "Dans le triangle ABC rectangle en B, on connaît $$AC=12\\text{ cm}$$ et $$\\widehat{A}=40°$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"310\" height=\"auto\" viewBox=\"0 0 310 190\"><polygon points=\"70,150 200,150 200,41\" fill=\"#fff7e8\" stroke=\"#b36b00\" stroke-width=\"2\"/><polyline points=\"185,150 185,135 200,135\" fill=\"none\" stroke=\"#b36b00\" stroke-width=\"2\"/><path d=\"M 105,150 A 35,35 0 0,0 97,128\" fill=\"none\" stroke=\"#b36b00\" stroke-width=\"2\"/><text x=\"55\" y=\"164\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"207\" y=\"164\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"207\" y=\"43\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text></svg></div>Calcule $$AB$$. Arrondis au dixième.",
        "answer": "[\"9,2\"]",
        "options": null,
        "footer": "$$AB=[[dec]]\\text{ cm}$$"
      },
      {
        "n": 6,
        "statement": "Dans le triangle ABC rectangle en B, on connaît $$AB=8\\text{ cm}$$ et $$\\widehat{A}=35°$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"310\" height=\"auto\" viewBox=\"0 0 310 190\"><polygon points=\"70,150 209,150 209,52\" fill=\"#fff7e8\" stroke=\"#b36b00\" stroke-width=\"2\"/><polyline points=\"194,150 194,135 209,135\" fill=\"none\" stroke=\"#b36b00\" stroke-width=\"2\"/><path d=\"M 105,150 A 35,35 0 0,0 99,130\" fill=\"none\" stroke=\"#b36b00\" stroke-width=\"2\"/><text x=\"55\" y=\"164\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"216\" y=\"164\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"216\" y=\"54\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text></svg></div>Calcule $$AC$$. Arrondis au dixième.",
        "answer": "[\"9,8\"]",
        "options": null,
        "footer": "$$AC=[[dec]]\\text{ cm}$$"
      },
      {
        "n": 7,
        "statement": "Dans un triangle ABC rectangle en B, l'hypoténuse est :&&le côté AB&&le côté AC&&le côté BC&&le plus petit côté&&",
        "answer": "[\"2\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 8,
        "statement": "Un élève veut calculer un côté adjacent avec le cosinus. L'hypoténuse mesure $$10\\text{ cm}$$ et il obtient $$12\\text{ cm}$$ pour le côté adjacent. Que peut-on dire ?&&Le résultat est impossible : un côté adjacent ne peut pas être plus long que l'hypoténuse.&&Le résultat est possible dans un triangle rectangle.&&Il faut seulement changer l'unité.&&Le cosinus donne toujours un résultat supérieur à l'hypoténuse.&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 9,
        "statement": "Dans un triangle, on connaît deux côtés et un angle, mais on ne sait pas si le triangle est rectangle. Peut-on appliquer directement la formule du cosinus vue au collège ?&&Oui, toujours.&&Non, il faut d'abord savoir que le triangle est rectangle.&&Oui, si le triangle est assez grand.&&Oui, si les longueurs sont entières.&&",
        "answer": "[\"2\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 10,
        "statement": "Dans le triangle ABC rectangle en B, quelles égalités sont correctes ?&&$$\\cos(\\widehat{A})=\\dfrac{AB}{AC}$$&&$$\\cos(\\widehat{C})=\\dfrac{BC}{AC}$$&&$$\\cos(\\widehat{A})=\\dfrac{BC}{AC}$$&&$$\\cos(\\widehat{C})=\\dfrac{AB}{AC}$$&&",
        "answer": "[\"1\",\"2\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm]]"
      }
    ]
  },
  {
    "id": "dnb_27",
    "num": 27,
    "title": "Symétries axiale, centrale et translation",
    "level_tags": [
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "<div style=\"text-align:center\">Dans le repère ci-dessous, le point $$B$$ est représenté. Quelles sont les coordonnées de son image $$B'$$ par la symétrie axiale d'axe $$Ox$$ ?<br><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${cx}\" cy=\"${cy}\" r=\"5\" fill=\"#8b1f5f\"/>\n<text x=\"${tx}\" y=\"${ty}\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#8b1f5f\">B</text>\n</svg></div>",
        "answer": "[\"x\",\"-y\"]",
        "options": {
          "formula_code": "setNB(1)\nx=RD(-3,3,[0])\ny=RD(1,3)\ncx=200+x*40\ncy=200-y*40\ntx=cx+10\nty=cy-8"
        },
        "footer": "$$B'(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
      },
      {
        "n": 2,
        "statement": "<div style=\"text-align:center\">Dans le repère ci-dessous, le point $$A$$ est représenté. Quelles sont les coordonnées de son image $$A'$$ par la symétrie axiale d'axe $$Oy$$ ?<br><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${cx}\" cy=\"${cy}\" r=\"5\" fill=\"#1f5f8b\"/>\n<text x=\"${tx}\" y=\"${ty}\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#1f5f8b\">A</text>\n</svg></div>",
        "answer": "[\"-x\",\"y\"]",
        "options": {
          "formula_code": "setNB(1)\nx=RD(1,3)\ny=RD(-3,3,[0])\ncx=200+x*40\ncy=200-y*40\ntx=cx+10\nty=cy-8"
        },
        "footer": "$$A'(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
      },
      {
        "n": 3,
        "statement": "<div style=\"text-align:center\">Dans le repère ci-dessous, le point $$C$$ est représenté. Quelles sont les coordonnées de son image $$C'$$ par la symétrie centrale de centre $$O$$ ?<br><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${cx}\" cy=\"${cy}\" r=\"5\" fill=\"#2e7d32\"/>\n<text x=\"${tx}\" y=\"${ty}\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#2e7d32\">C</text>\n</svg></div>",
        "answer": "[\"-x\",\"-y\"]",
        "options": {
          "formula_code": "setNB(1)\nx=RD(-3,3,[0])\ny=RD(-3,3,[0])\ncx=200+x*40\ncy=200-y*40\ntx=cx+10\nty=cy-8"
        },
        "footer": "$$C'(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
      },
      {
        "n": 4,
        "statement": "<div style=\"text-align:center\">Dans le repère ci-dessous, la droite $$d$$ est un axe de symétrie. Quelles sont les coordonnées de l'image $$A'$$ du point $$A$$ par la symétrie axiale d'axe $$d$$ ?<br><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<line x1=\"${dxsvg}\" y1=\"40\" x2=\"${dxsvg}\" y2=\"360\" stroke=\"#c0392b\" stroke-width=\"2\" stroke-dasharray=\"6,5\"/>\n<text x=\"${dlabelx}\" y=\"55\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#c0392b\">d</text>\n<circle cx=\"${axsvg}\" cy=\"${aysvg}\" r=\"5\" fill=\"#1f5f8b\"/>\n<text x=\"${atx}\" y=\"${aty}\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#1f5f8b\">A</text>\n</svg></div>",
        "answer": "[\"xp\",\"y\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(-1,1)\nd=RD(1,2)\nx=k-d\ny=RD(-3,3,[0])\nxp=k+d\ndxsvg=200+k*40\ndlabelx=dxsvg+8\naxsvg=200+x*40\naysvg=200-y*40\natx=axsvg+10\naty=aysvg-8"
        },
        "footer": "$$A'(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
      },
      {
        "n": 5,
        "statement": "<div style=\"text-align:center\">Dans le repère ci-dessous, le point $$S$$ est le centre d'une symétrie centrale et $$A$$ est un point. Quelles sont les coordonnées de l'image $$A'$$ ?<br><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${ssx}\" cy=\"${ssy}\" r=\"5\" fill=\"#222\"/>\n<text x=\"${stx}\" y=\"${sty}\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#222\">S</text>\n<circle cx=\"${asx}\" cy=\"${asy}\" r=\"5\" fill=\"#1f5f8b\"/>\n<text x=\"${atx}\" y=\"${aty}\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#1f5f8b\">A</text>\n</svg></div>",
        "answer": "[\"xp\",\"yp\"]",
        "options": {
          "formula_code": "setNB(1)\nxs=RD(-1,1)\nys=RD(-1,1)\ndx=RD(1,2)\ndy=RD(-2,2,[0])\nxa=xs-dx\nya=ys-dy\nxp=xs+dx\nyp=ys+dy\nssx=200+xs*40\nssy=200-ys*40\nasx=200+xa*40\nasy=200-ya*40\nstx=ssx+10\nsty=ssy-8\natx=asx+10\naty=asy-8"
        },
        "footer": "$$A'(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
      },
      {
        "n": 6,
        "statement": "<div style=\"text-align:center\">Dans le repère ci-dessous, la translation qui envoie $$A$$ sur $$B$$ envoie le point $$C$$ sur le point $$D$$. Quelles sont les coordonnées de $$D$$ ?<br><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${sxa}\" cy=\"${sya}\" r=\"5\" fill=\"#1f5f8b\"/>\n<text x=\"${txa}\" y=\"${tya}\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#1f5f8b\">A</text>\n<circle cx=\"${sxb}\" cy=\"${syb}\" r=\"5\" fill=\"#2e7d32\"/>\n<text x=\"${txb}\" y=\"${tyb}\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#2e7d32\">B</text>\n<circle cx=\"${sxc}\" cy=\"${syc}\" r=\"5\" fill=\"#b36b00\"/>\n<text x=\"${txc}\" y=\"${tyc}\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#b36b00\">C</text>\n<line x1=\"${sxa}\" y1=\"${sya}\" x2=\"${sxb}\" y2=\"${syb}\" stroke=\"#777\" stroke-width=\"1.5\" stroke-dasharray=\"5,4\"/>\n</svg></div>",
        "answer": "[\"xd\",\"yd\"]",
        "options": {
          "formula_code": "setNB(1)\nu=RD(1,2)\nv=RD(-1,1,[0])\nyaMin=(v>0)?-3:-2\nyaMax=(v>0)?2:3\nycMin=(v>0)?-3:-2\nycMax=(v>0)?2:3\nxa=RD(-3,1)\nya=RD(yaMin,yaMax)\nxb=xa+u\nyb=ya+v\nxc=RD(-3,1)\nyc=RD(ycMin,ycMax)\nxd=xc+u\nyd=yc+v\nsxa=200+xa*40\nsya=200-ya*40\nsxb=200+xb*40\nsyb=200-yb*40\nsxc=200+xc*40\nsyc=200-yc*40\ntxa=sxa+10\ntya=sya-8\ntxb=sxb+10\ntyb=syb-8\ntxc=sxc+10\ntyc=syc-8"
        },
        "footer": "$$D(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
      },
      {
        "n": 7,
        "statement": "Par une symétrie axiale, quelles propriétés sont conservées ?&&les longueurs&&l'alignement des points&&la mesure des angles&&Aucune propriété n'est conservée&&",
        "answer": "[\"1\",\"2\",\"3\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm]]"
      },
      {
        "n": 8,
        "statement": "Dans le repère ci-dessous, quelle transformation envoie $$A$$ sur $$A'$$ ?<br><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"auto\" viewBox=\"0 0 400 400\" style=\"max-width:380px\">\n<g stroke=\"#ccc\" stroke-width=\"1\">\n<line x1=\"40\" y1=\"40\" x2=\"360\" y2=\"40\"/>\n<line x1=\"40\" y1=\"80\" x2=\"360\" y2=\"80\"/>\n<line x1=\"40\" y1=\"120\" x2=\"360\" y2=\"120\"/>\n<line x1=\"40\" y1=\"160\" x2=\"360\" y2=\"160\"/>\n<line x1=\"40\" y1=\"240\" x2=\"360\" y2=\"240\"/>\n<line x1=\"40\" y1=\"280\" x2=\"360\" y2=\"280\"/>\n<line x1=\"40\" y1=\"320\" x2=\"360\" y2=\"320\"/>\n<line x1=\"40\" y1=\"360\" x2=\"360\" y2=\"360\"/>\n<line x1=\"40\" y1=\"40\" x2=\"40\" y2=\"360\"/>\n<line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"360\"/>\n<line x1=\"120\" y1=\"40\" x2=\"120\" y2=\"360\"/>\n<line x1=\"160\" y1=\"40\" x2=\"160\" y2=\"360\"/>\n<line x1=\"240\" y1=\"40\" x2=\"240\" y2=\"360\"/>\n<line x1=\"280\" y1=\"40\" x2=\"280\" y2=\"360\"/>\n<line x1=\"320\" y1=\"40\" x2=\"320\" y2=\"360\"/>\n<line x1=\"360\" y1=\"40\" x2=\"360\" y2=\"360\"/>\n</g>\n<line x1=\"40\" y1=\"200\" x2=\"370\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"370,200 360,195 360,205\" fill=\"#222\"/>\n<line x1=\"200\" y1=\"360\" x2=\"200\" y2=\"30\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"200,30 195,40 205,40\" fill=\"#222\"/>\n<text x=\"80\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-3</text>\n<text x=\"120\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-2</text>\n<text x=\"160\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">-1</text>\n<text x=\"240\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">1</text>\n<text x=\"280\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">2</text>\n<text x=\"320\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">3</text>\n<text x=\"186\" y=\"85\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">3</text>\n<text x=\"186\" y=\"125\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">2</text>\n<text x=\"186\" y=\"165\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">1</text>\n<text x=\"186\" y=\"245\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-1</text>\n<text x=\"186\" y=\"285\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-2</text>\n<text x=\"186\" y=\"325\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">-3</text>\n<text x=\"190\" y=\"218\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"end\">0</text>\n<circle cx=\"${asx}\" cy=\"${asy}\" r=\"5\" fill=\"#1f5f8b\"/>\n<text x=\"${atx}\" y=\"${aty}\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#1f5f8b\">A</text>\n<circle cx=\"${psx}\" cy=\"${psy}\" r=\"5\" fill=\"#c0392b\"/>\n<text x=\"${ptx}\" y=\"${pty}\" font-family=\"serif\" font-style=\"italic\" font-size=\"20\" fill=\"#c0392b\">A'</text>\n<line x1=\"${asx}\" y1=\"${asy}\" x2=\"${psx}\" y2=\"${psy}\" stroke=\"#999\" stroke-width=\"1\" stroke-dasharray=\"4,4\"/>\n</svg>&&la symétrie centrale de centre O&&la symétrie axiale d'axe Ox&&la symétrie axiale d'axe Oy&&une translation verticale&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\n// x and y non nuls pour éviter une symétrie selon Ox ou Oy\nx=RD(-3,3,[0])\ny=RD(-3,3,[0])\nasx=200+x*40\nasy=200-y*40\npsx=200-x*40\npsy=200+y*40\natx=asx+10\naty=asy-8\nptx=psx+10\npty=psy-8",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 9,
        "statement": "Une figure est transformée par une translation. Quelle affirmation est vraie ?&&La figure glisse sans tourner ni se retourner.&&La figure est forcément agrandie.&&La figure est retournée comme dans un miroir.&&La figure subit un demi-tour autour d'un point.&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      }
    ]
  }
];
