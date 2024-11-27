#!/bin/bash

wget -O doc.html https://docs.google.com/document/d/1Xp70uPO2WK65GRizu9e2HhYiTmxr3RNvUOX27lYNWtU/mobilebasic?tab=t.2j3hrvttrhug
ucpem run @/MiniML+cli build doc.html doc.tex --htmlSelector=.doc-content
