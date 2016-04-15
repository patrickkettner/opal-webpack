class Opal::Nodes::TopNode
  def closing
    if compiler.requirable?
      line "}; /* test */\n"
    elsif compiler.eval?
      line "})(Opal, self) /* test */"
    else
      line "})(Opal); /* test */\n"
    end
  end
end
